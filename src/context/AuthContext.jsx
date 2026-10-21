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

export const AVATAR_PRESETS = [
  'from-blue-500 via-indigo-500 to-cyan-400',
  'from-rose-500 via-pink-500 to-amber-400',
  'from-emerald-400 via-teal-500 to-cyan-500',
  'from-violet-500 via-purple-600 to-fuchsia-500',
  'from-amber-400 via-orange-500 to-red-500',
];

async function ensureUserDoc(user, extra = {}) {
  if (!user?.uid) return null;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const initial = {
      uid: user.uid,
      name: user.displayName || extra.name || user.email?.split('@')[0] || 'Viewer',
      email: user.email || '',
      avatar: extra.avatar || AVATAR_PRESETS[0],
      myList: [],
      history: [],
      searchHistory: [],
      settings: { autoplayNext: true, defaultServer: 1 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, initial, { merge: true });
    return initial;
  }
  const existing = snap.data();
  if (extra.name && !existing.name) {
    await setDoc(userRef, { name: extra.name, updatedAt: serverTimestamp() }, { merge: true });
    return { ...existing, name: extra.name };
  }
  return existing;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const data = await ensureUserDoc(nextUser);
          setProfile(data);
        } catch {
          setProfile({
            name: nextUser.displayName || nextUser.email?.split('@')[0] || 'Viewer',
            email: nextUser.email || '',
            avatar: AVATAR_PRESETS[0],
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAuthModal = useCallback((mode = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const cleanName = name || email.split('@')[0];
    await updateProfile(cred.user, { displayName: cleanName });
    const data = await ensureUserDoc(cred.user, { name: cleanName });
    setProfile(data);
    return cred.user;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const data = await ensureUserDoc(cred.user);
    setProfile(data);
    return cred.user;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const data = await ensureUserDoc(cred.user);
    setProfile(data);
    return cred.user;
  }, []);

  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email), []);

  const updateUserProfile = useCallback(
    async ({ name, avatar }) => {
      if (!user) return;
      const patch = {};
      if (name !== undefined) {
        patch.name = name;
        await updateProfile(user, { displayName: name });
      }
      if (avatar !== undefined) patch.avatar = avatar;
      patch.updatedAt = serverTimestamp();
      await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
      setProfile((prev) => ({ ...prev, ...patch }));
    },
    [user]
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const displayName = useMemo(() => {
    if (!user) return '';
    return profile?.name || user.displayName || user.email?.split('@')[0] || 'Viewer';
  }, [user, profile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isSignedIn: Boolean(user),
      displayName,
      avatarGradient: profile?.avatar || AVATAR_PRESETS[0],
      authModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signUp,
      signIn,
      signInWithGoogle,
      resetPassword,
      updateUserProfile,
      signOut,
    }),
    [
      user,
      profile,
      loading,
      displayName,
      authModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signUp,
      signIn,
      signInWithGoogle,
      resetPassword,
      updateUserProfile,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
