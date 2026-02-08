import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile } from '../types/user.types';

const googleProvider = new GoogleAuthProvider();

export async function signUp(email: string, password: string, name: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

  const profile: UserProfile = {
    uid: credential.user.uid,
    email,
    name,
    heightUnit: 'cm',
    activityLevel: 'moderate',
    goal: 'maintain',
    preferences: {
      theme: 'dark',
      weightUnit: 'kg',
      macroDisplay: 'grams',
      notifications: true,
    },
  };

  await setDoc(doc(db, 'users', credential.user.uid), profile);
  return credential.user;
}

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

  if (!userDoc.exists()) {
    const profile: UserProfile = {
      uid: credential.user.uid,
      email: credential.user.email || '',
      name: credential.user.displayName || '',
      heightUnit: 'cm',
      activityLevel: 'moderate',
      goal: 'maintain',
      preferences: {
        theme: 'dark',
        weightUnit: 'kg',
        macroDisplay: 'grams',
        notifications: true,
      },
    };
    await setDoc(doc(db, 'users', credential.user.uid), profile);
  }

  return credential.user;
}

export async function logOut() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
