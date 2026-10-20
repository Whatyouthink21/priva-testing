import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const ListContext = createContext(null);
export const useList = () => useContext(ListContext);

export function ListProvider({ children }) {
  const { userCode } = useAuth();
  const storageKey = userCode ? `priva_list_${userCode}` : "priva_list_guest";
  const [myList, setMyList] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const key = userCode ? `priva_list_${userCode}` : "priva_list_guest";
    try {
      const raw = localStorage.getItem(key);
      setMyList(raw ? JSON.parse(raw) : []);
    } catch { setMyList([]); }
  }, [userCode]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(myList));
  }, [myList, storageKey]);

  const addToList = (item) => {
    setMyList(prev => {
      if (prev.find(x => x.id === item.id && x.media_type === item.media_type)) return prev;
      return [...prev, item];
    });
  };
  const removeFromList = (id, media_type) => {
    setMyList(prev => prev.filter(x => !(x.id === id && x.media_type === media_type)));
  };
  const isInList = (id, media_type) => myList.some(x => x.id === id && x.media_type === media_type);
  const toggleList = (item) => {
    if (isInList(item.id, item.media_type)) removeFromList(item.id, item.media_type);
    else addToList(item);
  };

  return (
    <ListContext.Provider value={{ myList, addToList, removeFromList, isInList, toggleList }}>
      {children}
    </ListContext.Provider>
  );
}
