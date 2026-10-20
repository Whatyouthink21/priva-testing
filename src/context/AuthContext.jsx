import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AuthContext = createContext(null);
const GUEST_KEY = 'priva:guest';

async function ensureProfile(user, extra = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        name: user.displayName || extra.name || '',
        email: user.email || '',
        createdAt: serverTimestamp(),
        myList: [],
        favorites: [],
        history: [],
        settings: {},
      },
      { merge: true }
    );
  } else if (extra.name && !snap.data().name) {
    await setDoc(ref, { name: extra.name }, { merge: true });
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(() => localStorage.getItem(GUEST_KEY) === '1');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        localStorage.removeItem(GUEST_KEY);
        setGuest(false);
        try {
          const snap = await getDoc(doc(db, 'users', nextUser.uid));
          setProfile(snap.exists() ? snap.data() : null);
          if (!snap.exists()) await ensureProfile(nextUser);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await ensureProfile(cred.user, { name });
    return cred.user;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureProfile(cred.user);
    return cred.user;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureProfile(cred.user);
    return cred.user;
  }, []);

  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email), []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem(GUEST_KEY);
    setGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, '1');
    setGuest(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      guest,
      isSignedIn: Boolean(user),
      displayName: user?.displayName || profile?.name || (guest ? 'Guest' : ''),
      signUp,
      signIn,
      signInWithGoogle,
      resetPassword,
      signOut,
      continueAsGuest,
    }),
    [user, profile, loading, guest, signUp, signIn, signInWithGoogle, resetPassword, signOut, continueAsGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
