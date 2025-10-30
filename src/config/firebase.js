// src/config/firebase.js
// ✅ Final production-ready Firebase setup
// - Prevents build errors (always exports storage, even if null)
// - Safe for both local + Vercel environments
// - Guards against missing Firebase Storage setup

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import errorHandler from "../utils/errorHandler";

// Environment-based Firebase config (from .env or Vercel dashboard)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Ensure single instance
let app;
let auth;
let db;
let storage = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Try to get storage safely
  if (firebaseConfig.storageBucket) {
    try {
      storage = getStorage(app);
    } catch (err) {
      console.warn("⚠️ Firebase Storage not configured properly. Continuing without storage.");
      storage = null;
    }
  } else {
    console.warn("⚠️ No storageBucket provided in Firebase config.");
  }
} catch (err) {
  console.error("❌ Firebase initialization error:", err);
  if (errorHandler && typeof errorHandler.handle === "function") {
    errorHandler.handle(err, "FirebaseInit");
  }
}

// Export everything safely
export { app, auth, db, storage };
export default app;
