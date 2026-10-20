import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WatchContext = createContext(null);
export const useWatchHistory = () => useContext(WatchContext);

export function WatchHistoryProvider({ children }) {
  const { userCode } = useAuth();
  const storageKey = userCode ? `priva_history_${userCode}` : "priva_history_guest";
  const storageProgressKey = userCode ? `priva_progress_${userCode}` : "priva_progress_guest";

  const [history, setHistory] = useState(() => {
    try { const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [progress, setProgress] = useState(() => {
    try { const raw = localStorage.getItem(storageProgressKey); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });

  useEffect(() => {
    const key = userCode ? `priva_history_${userCode}` : "priva_history_guest";
    try { const raw = localStorage.getItem(key); setHistory(raw ? JSON.parse(raw) : []); } catch { setHistory([]); }
    const pkey = userCode ? `priva_progress_${userCode}` : "priva_progress_guest";
    try { const raw = localStorage.getItem(pkey); setProgress(raw ? JSON.parse(raw) : {}); } catch { setProgress({}); }
  }, [userCode]);

  useEffect(()=> localStorage.setItem(storageKey, JSON.stringify(history)), [history, storageKey]);
  useEffect(()=> localStorage.setItem(storageProgressKey, JSON.stringify(progress)), [progress, storageProgressKey]);

  const addToHistory = (item) => {
    setHistory(prev => {
      const filtered = prev.filter(x => !(x.id === item.id && x.media_type === item.media_type));
      const entry = { ...item, watchedAt: Date.now() };
      return [entry, ...filtered].slice(0, 50);
    });
  };

  const updateProgress = (key, data) => {
    // key like "movie:123" or "tv:123:s1e1"
    setProgress(prev => ({ ...prev, [key]: data }));
  };

  const getProgress = (key) => progress[key] || null;

  const clearHistory = () => setHistory([]);

  // Listen to postMessage from players
  useEffect(()=> {
    const handler = (e) => {
      const d = e.data;
      if(!d || d.type !== "TGFLIX_EVENT") return;
      if(d.event === "timeupdate" || d.event === "pause") {
        // This will be handled per watch page; we also store generically
      }
    };
    window.addEventListener("message", handler);
    return ()=> window.removeEventListener("message", handler);
  }, []);

  return (
    <WatchContext.Provider value={{ history, progress, addToHistory, updateProgress, getProgress, clearHistory }}>
      {children}
    </WatchContext.Provider>
  );
}
