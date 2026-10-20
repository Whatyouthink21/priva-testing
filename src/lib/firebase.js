import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDg0D51XL2kYvVQCyVJu_zTlZyYHjs6EgA",
  authDomain: "priva-movies.firebaseapp.com",
  projectId: "priva-movies",
  storageBucket: "priva-movies.firebasestorage.app",
  messagingSenderId: "771882692538",
  appId: "1:771882692538:web:ddb8f87ab08fd44e8bb783",
  measurementId: "G-0T1DQQH4L1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Generate random 5 digit code
export function generate5DigitCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function createUserWithCode(code) {
  const ref = doc(db, "priva_users", code);
  const snap = await getDoc(ref);
  if (snap.exists()) return false; // already exists
  await setDoc(ref, {
    code,
    createdAt: serverTimestamp(),
    myList: [],
    watchHistory: [],
  });
  return true;
}

export async function verifyCodeExists(code) {
  if (!code || code.length !== 5 || !/^\d{5}$/.test(code)) return false;
  const ref = doc(db, "priva_users", code);
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function getUserData(code) {
  const ref = doc(db, "priva_users", code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
