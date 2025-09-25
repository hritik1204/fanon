// src/auth.ts
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function signUpEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  // create user doc
  await setDoc(
    doc(db, "users", cred.user.uid),
    {
      displayName: displayName || null,
      email,
      isAdmin: false,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return cred.user;
}

export async function signInEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInAnonAndCreateDoc() {
  const { user } = await signInAnonymously(auth);
  await setDoc(
    doc(db, "users", user.uid),
    {
      displayName: "Anonymous",
      email: null,
      isAdmin: false,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return user;
}

export async function doSignOut() {
  await signOut(auth);
}
