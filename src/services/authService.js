// File: src/services/authService.js

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const checkUserExists = async (email) => {
  try {
    const sanitizedEmail = email.replace(/[@.]/g, '_');
    const userDoc = await getDoc(doc(db, 'users', sanitizedEmail));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user:', error);
    return false;
  }
};

export const signUp = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  
  try {
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      name,
      createdAt: new Date().toISOString(),
      verificationStatus: 'none',
      verificationMethod: null,
      verificationDocument: null,
      verificationSubmittedAt: null,
      articlesRead: 0,
      bookmarksCount: 0,
      preferences: {
        language: 'en',
        categories: []
      }
    });
  } catch (firestoreError) {
    console.error('Firestore write error:', firestoreError);
    // Continue anyway - auth succeeded
  }
  
  return userCredential.user;
};

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logOut = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};