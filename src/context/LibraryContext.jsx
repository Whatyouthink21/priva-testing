import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const LibraryContext = createContext(null);
const LOCAL_STORAGE_KEY = 'priva:library:v1';

const DEFAULT_LIBRARY = {
  myList: [],
  history: [],
  searchHistory: [],
  settings: {
    autoplayNext: true,
    defaultServer: 1,
  },
};

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_LIBRARY;
    const parsed = JSON.parse(raw);
    return {
      myList: Array.isArray(parsed.myList) ? parsed.myList : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory : [],
      settings: { ...DEFAULT_LIBRARY.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULT_LIBRARY;
  }
}

function writeLocal(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

function mediaKey(item) {
  return `${item?.type || 'movie'}:${item?.id}`;
}

function mergeByKey(primary = [], secondary = []) {
  const map = new Map();
  for (const item of [...primary, ...secondary]) {
    if (!item?.id) continue;
    const k = mediaKey(item);
    if (!map.has(k)) {
      map.set(k, item);
    } else {
      const existing = map.get(k);
      const tA = new Date(existing.updatedAt || existing.addedAt || 0).getTime();
      const tB = new Date(item.updatedAt || item.addedAt || 0).getTime();
      if (tB > tA) map.set(k, item);
    }
  }
  return Array.from(map.values());
}

export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(readLocal);
  const [synced, setSynced] = useState(false);
  const remoteLock = useRef(false);

  // Live Firestore sync when signed into Firebase
  useEffect(() => {
    if (!user?.uid) {
      setState(readLocal());
      setSynced(true);
      return undefined;
    }

    const ref = doc(db, 'users', user.uid);
    let didInitialMerge = false;

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const remote = snap.exists() ? snap.data() : {};
        const local = readLocal();

        if (!didInitialMerge) {
          didInitialMerge = true;
          const mergedList = mergeByKey(remote.myList || [], local.myList || []);
          const mergedHistory = mergeByKey(remote.history || [], local.history || []).sort(
            (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
          );
          const mergedSearches = Array.from(
            new Set([...(remote.searchHistory || []), ...(local.searchHistory || [])])
          ).slice(0, 12);
          const nextState = {
            myList: mergedList,
            history: mergedHistory,
            searchHistory: mergedSearches,
            settings: { ...DEFAULT_LIBRARY.settings, ...(remote.settings || {}) },
          };
          remoteLock.current = true;
          setState(nextState);
          writeLocal(nextState);
          setSynced(true);

          // Push merged local activity to Firebase if needed
          if (
            mergedList.length !== (remote.myList || []).length ||
            mergedHistory.length !== (remote.history || []).length
          ) {
            setDoc(
              ref,
              {
                myList: mergedList,
                history: mergedHistory,
                searchHistory: mergedSearches,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            ).catch(() => {});
          }
          return;
        }

        remoteLock.current = true;
        const nextState = {
          myList: Array.isArray(remote.myList) ? remote.myList : [],
          history: Array.isArray(remote.history) ? remote.history : [],
          searchHistory: Array.isArray(remote.searchHistory) ? remote.searchHistory : [],
          settings: { ...DEFAULT_LIBRARY.settings, ...(remote.settings || {}) },
        };
        setState(nextState);
        writeLocal(nextState);
        setSynced(true);
      },
      () => {
        setSynced(true);
      }
    );

    return unsub;
  }, [user?.uid]);

  const persist = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        writeLocal(next);
        if (user?.uid) {
          setDoc(
            doc(db, 'users', user.uid),
            {
              myList: next.myList,
              history: next.history,
              searchHistory: next.searchHistory,
              settings: next.settings,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
        return next;
      });
    },
    [user?.uid]
  );

  const isInList = useCallback(
    (item) => Boolean(item) && state.myList.some((x) => mediaKey(x) === mediaKey(item)),
    [state.myList]
  );

  const toggleMyList = useCallback(
    (rawItem) => {
      if (!rawItem?.id) return false;
      const item = {
        id: Number(rawItem.id),
        type: rawItem.type || 'movie',
        isAnime: Boolean(rawItem.isAnime),
        badge: rawItem.badge || (rawItem.isAnime ? 'Anime' : rawItem.type === 'tv' ? 'Series' : 'Movie'),
        title: rawItem.title || 'Untitled',
        poster: rawItem.poster || rawItem.poster_path || null,
        backdrop: rawItem.backdrop || rawItem.backdrop_path || null,
        rating: Number(rawItem.rating ?? rawItem.vote_average ?? 0),
        year: rawItem.year || '',
        overview: rawItem.overview || '',
        addedAt: new Date().toISOString(),
      };
      let added = false;
      persist((prev) => {
        const exists = prev.myList.some((x) => mediaKey(x) === mediaKey(item));
        added = !exists;
        return {
          ...prev,
          myList: exists
            ? prev.myList.filter((x) => mediaKey(x) !== mediaKey(item))
            : [item, ...prev.myList],
        };
      });
      return added;
    },
    [persist]
  );

  const removeFromList = useCallback(
    (item) => {
      persist((prev) => ({
        ...prev,
        myList: prev.myList.filter((x) => mediaKey(x) !== mediaKey(item)),
      }));
    },
    [persist]
  );

  const saveWatchProgress = useCallback(
    (entry) => {
      if (!entry?.id) return;
      const normalizedProgress = Math.min(100, Math.max(2, Number(entry.progress) || 5));
      const finished = Boolean(entry.ended) || normalizedProgress >= 97;

      const cleanEntry = {
        id: Number(entry.id),
        type: entry.type || 'movie',
        isAnime: Boolean(entry.isAnime),
        badge: entry.badge || (entry.isAnime ? 'Anime' : entry.type === 'tv' ? 'Series' : 'Movie'),
        title: entry.title || 'Untitled',
        poster: entry.poster || null,
        backdrop: entry.backdrop || null,
        episodeStill: entry.episodeStill || null,
        episodeName: entry.episodeName || '',
        season: entry.type === 'tv' ? Number(entry.season || 1) : null,
        episode: entry.type === 'tv' ? Number(entry.episode || 1) : null,
        timestamp: Math.max(0, Math.floor(Number(entry.timestamp) || 0)),
        duration: Math.max(0, Math.floor(Number(entry.duration) || 0)),
        progress: finished ? 100 : normalizedProgress,
        finished,
        rating: Number(entry.rating || 0),
        year: entry.year || '',
        updatedAt: new Date().toISOString(),
      };

      persist((prev) => ({
        ...prev,
        history: [
          cleanEntry,
          ...prev.history.filter((x) => mediaKey(x) !== mediaKey(cleanEntry)),
        ].slice(0, 80),
      }));
    },
    [persist]
  );

  const removeWatchProgress = useCallback(
    (item) => {
      persist((prev) => ({
        ...prev,
        history: prev.history.filter((x) => mediaKey(x) !== mediaKey(item)),
      }));
    },
    [persist]
  );

  const clearWatchHistory = useCallback(() => {
    persist((prev) => ({ ...prev, history: [] }));
  }, [persist]);

  const addSearchTerm = useCallback(
    (term) => {
      const clean = String(term || '').trim();
      if (clean.length < 2) return;
      persist((prev) => ({
        ...prev,
        searchHistory: [clean, ...prev.searchHistory.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 10),
      }));
    },
    [persist]
  );

  const clearSearchHistory = useCallback(() => {
    persist((prev) => ({ ...prev, searchHistory: [] }));
  }, [persist]);

  const updateSettings = useCallback(
    (patch) => {
      persist((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
    },
    [persist]
  );

  const getProgress = useCallback(
    (type, id) => {
      const item = state.history.find((x) => x.type === type && Number(x.id) === Number(id));
      return item && !item.finished ? item : null;
    },
    [state.history]
  );

  const continueWatching = useMemo(
    () => state.history.filter((x) => !x.finished).slice(0, 20),
    [state.history]
  );

  const recentSeeds = useMemo(() => {
    const seeds = [...state.history, ...state.myList];
    const unique = [];
    const seen = new Set();
    for (const s of seeds) {
      const k = mediaKey(s);
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(s);
      }
      if (unique.length >= 2) break;
    }
    return unique;
  }, [state.history, state.myList]);

  const value = useMemo(
    () => ({
      myList: state.myList,
      history: state.history,
      continueWatching,
      recentSeeds,
      searchHistory: state.searchHistory,
      settings: state.settings,
      synced,
      isInList,
      toggleMyList,
      removeFromList,
      saveWatchProgress,
      removeWatchProgress,
      clearWatchHistory,
      clearContinueWatching: clearWatchHistory,
      addSearchTerm,
      clearSearchHistory,
      updateSettings,
      getProgress,
    }),
    [
      state,
      continueWatching,
      recentSeeds,
      synced,
      isInList,
      toggleMyList,
      removeFromList,
      saveWatchProgress,
      removeWatchProgress,
      clearWatchHistory,
      addSearchTerm,
      clearSearchHistory,
      updateSettings,
      getProgress,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
