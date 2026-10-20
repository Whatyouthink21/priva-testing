import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const LibraryContext = createContext(null);
const STORE_KEY = 'priva:library';

const EMPTY = { myList: [], favorites: [], history: [], settings: {} };
const DEFAULT_SETTINGS = {
  autoplayNext: true,
  preferredServer: 1,
  subtitles: 'english',
};

function readLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      myList: Array.isArray(parsed.myList) ? parsed.myList : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      settings: parsed.settings || {},
    };
  } catch {
    return { ...EMPTY };
  }
}

const slim = (item) => ({
  id: item.id,
  type: item.type,
  title: item.title,
  poster: item.poster || null,
  backdrop: item.backdrop || null,
  rating: item.rating || 0,
  year: item.year || '',
});

const keyOf = (item) => `${item.type}:${item.id}`;

export function LibraryProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState(readLocal);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef(null);
  const skipSave = useRef(true);

  // Load the signed-in user's library (or keep the local one for guests).
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      skipSave.current = true;
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (!cancelled && snap.exists()) {
            const data = snap.data();
            setState({
              myList: Array.isArray(data.myList) ? data.myList : [],
              favorites: Array.isArray(data.favorites) ? data.favorites : [],
              history: Array.isArray(data.history) ? data.history : [],
              settings: data.settings || {},
            });
          }
        } catch {
          /* keep local state if Firestore is unreachable */
        }
      } else {
        setState(readLocal());
      }
      if (!cancelled) {
        setReady(true);
        window.setTimeout(() => {
          skipSave.current = false;
        }, 60);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Persist: Firestore for members (debounced), localStorage for guests.
  useEffect(() => {
    if (!ready || skipSave.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (user) {
        setDoc(
          doc(db, 'users', user.uid),
          {
            myList: state.myList,
            favorites: state.favorites,
            history: state.history,
            settings: { ...DEFAULT_SETTINGS, ...state.settings },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      } else {
        try {
          localStorage.setItem(STORE_KEY, JSON.stringify(state));
        } catch {
          /* storage full / disabled */
        }
      }
    }, 450);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, ready, user]);

  const toggleList = useCallback((item) => {
    const entry = slim(item);
    let added = false;
    setState((prev) => {
      const exists = prev.myList.some((x) => keyOf(x) === keyOf(entry));
      added = !exists;
      return {
        ...prev,
        myList: exists
          ? prev.myList.filter((x) => keyOf(x) !== keyOf(entry))
          : [{ ...entry, addedAt: new Date().toISOString() }, ...prev.myList],
      };
    });
    return added;
  }, []);

  const toggleFavorite = useCallback((item) => {
    const entry = slim(item);
    let added = false;
    setState((prev) => {
      const exists = prev.favorites.some((x) => keyOf(x) === keyOf(entry));
      added = !exists;
      return {
        ...prev,
        favorites: exists
          ? prev.favorites.filter((x) => keyOf(x) !== keyOf(entry))
          : [{ ...entry, addedAt: new Date().toISOString() }, ...prev.favorites],
      };
    });
    return added;
  }, []);

  const saveProgress = useCallback((item, progress = {}) => {
    const entry = { ...slim(item), ...progress, updatedAt: new Date().toISOString() };
    if (!entry.progress || entry.progress < 1) entry.progress = 1;
    if (entry.progress > 97) {
      // Finished — drop it from Continue Watching but keep a light history entry.
      setState((prev) => ({
        ...prev,
        history: [
          { ...entry, progress: 100, finished: true },
          ...prev.history.filter((x) => keyOf(x) !== keyOf(entry)),
        ].slice(0, 120),
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      history: [
        entry,
        ...prev.history.filter((x) => keyOf(x) !== keyOf(entry)),
      ].slice(0, 120),
    }));
  }, []);

  const removeFromHistory = useCallback((item) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((x) => keyOf(x) !== keyOf(item)),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const isInList = useCallback(
    (item) => Boolean(item) && state.myList.some((x) => keyOf(x) === keyOf(item)),
    [state.myList]
  );
  const isFavorite = useCallback(
    (item) => Boolean(item) && state.favorites.some((x) => keyOf(x) === keyOf(item)),
    [state.favorites]
  );

  const progressFor = useCallback(
    (item) => {
      if (!item) return null;
      const found = state.history.find((x) => keyOf(x) === keyOf(item));
      return found && !found.finished ? found : null;
    },
    [state.history]
  );

  const continueWatching = useMemo(
    () =>
      state.history
        .filter((x) => !x.finished && x.progress > 1 && x.progress < 97)
        .slice(0, 20),
    [state.history]
  );

  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...state.settings }),
    [state.settings]
  );

  const value = useMemo(
    () => ({
      ...state,
      settings,
      ready,
      continueWatching,
      toggleList,
      toggleFavorite,
      saveProgress,
      removeFromHistory,
      clearHistory,
      updateSettings,
      isInList,
      isFavorite,
      progressFor,
    }),
    [
      state,
      settings,
      ready,
      continueWatching,
      toggleList,
      toggleFavorite,
      saveProgress,
      removeFromHistory,
      clearHistory,
      updateSettings,
      isInList,
      isFavorite,
      progressFor,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>');
  return ctx;
}
