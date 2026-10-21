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

/**
 * Repair progress values written by older builds: entries whose percent was
 * stored as a 0–1 fraction (or clamped to 1) get their real percent back
 * from timestamp/duration when both are known.
 */
function normalizeHistory(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const duration = Number(item.duration) || 0;
    const timestamp = Number(item.timestamp) || 0;
    let progress = Number(item.progress) || 0;
    if (duration > 0 && timestamp > 0) {
      const computed = Math.min(100, (timestamp / duration) * 100);
      if (computed > progress) progress = computed;
    } else if (progress > 0 && progress < 1) {
      progress = progress * 100; // legacy fraction
    }
    return { ...item, progress };
  });
}

function readLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      myList: Array.isArray(parsed.myList) ? parsed.myList : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      history: normalizeHistory(parsed.history),
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
  const stateRef = useRef(state);
  const userRef = useRef(user);
  const readyRef = useRef(false);

  stateRef.current = state;
  userRef.current = user;
  readyRef.current = ready;

  /** Write the library out right now (guests: localStorage, members: Firestore). */
  const persistNow = useCallback((snapshot) => {
    const current = snapshot || stateRef.current;
    const owner = userRef.current;
    if (owner) {
      setDoc(
        doc(db, 'users', owner.uid),
        {
          myList: current.myList,
          favorites: current.favorites,
          history: current.history,
          settings: { ...DEFAULT_SETTINGS, ...current.settings },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    } else {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(current));
      } catch {
        /* storage full / disabled */
      }
    }
  }, []);

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
              history: normalizeHistory(data.history),
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

  // Persist on change. Guests write localStorage synchronously (it is cheap
  // and means a closed tab can never lose the last resume point); member
  // writes to Firestore stay debounced.
  useEffect(() => {
    if (!ready || skipSave.current) return;
    if (!user) {
      persistNow(state);
      return;
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => persistNow(state), 450);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, ready, user, persistNow]);

  // Flush whatever is pending when the tab is hidden or closed so progress
  // saved in the last moments of a watch session is never lost.
  useEffect(() => {
    const flush = () => {
      if (!readyRef.current || skipSave.current) return;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      persistNow();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [persistNow]);

  const toggleList = useCallback((item) => {
    const entry = slim(item);
    // Decide from the ref so the return value is correct synchronously
    // (callers toast "Added"/"Removed" based on it).
    const added = !stateRef.current.myList.some((x) => keyOf(x) === keyOf(entry));
    setState((prev) => {
      const exists = prev.myList.some((x) => keyOf(x) === keyOf(entry));
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
    const added = !stateRef.current.favorites.some((x) => keyOf(x) === keyOf(entry));
    setState((prev) => {
      const exists = prev.favorites.some((x) => keyOf(x) === keyOf(entry));
      return {
        ...prev,
        favorites: exists
          ? prev.favorites.filter((x) => keyOf(x) !== keyOf(entry))
          : [{ ...entry, addedAt: new Date().toISOString() }, ...prev.favorites],
      };
    });
    return added;
  }, []);

  /** Remove one title from the watchlist (no-op if it is not there). */
  const removeFromList = useCallback((item) => {
    if (!item) return;
    setState((prev) => ({
      ...prev,
      myList: prev.myList.filter((x) => keyOf(x) !== keyOf(item)),
    }));
  }, []);

  /** Remove one title from favourites (no-op if it is not there). */
  const removeFromFavorites = useCallback((item) => {
    if (!item) return;
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.filter((x) => keyOf(x) !== keyOf(item)),
    }));
  }, []);

  const saveProgress = useCallback((item, progress = {}) => {
    if (!item || !item.title) return;
    const entry = { ...slim(item), ...progress, updatedAt: new Date().toISOString() };
    // Percent might arrive as a 0–1 fraction from some callers.
    if (entry.progress > 0 && entry.progress < 1) entry.progress = entry.progress * 100;
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
        .filter((x) => !x.finished && x.progress >= 1 && x.progress < 97)
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
      removeFromList,
      removeFromFavorites,
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
      removeFromList,
      removeFromFavorites,
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
