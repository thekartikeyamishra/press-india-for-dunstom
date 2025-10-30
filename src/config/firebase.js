// E:\press-india\src\config\firebase.js
// ================================
// Production-ready Firebase initializer (NO Storage)
// - Initializes Firebase App, Auth and Firestore
// - Safe Analytics init (only if supported)
// - Uses environment variables (Vite style import.meta.env)
// - Minimal, stable exports to avoid breaking existing code
// ================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { isSupported, getAnalytics } from "firebase/analytics";
import errorHandler from "../utils/errorHandler.js";

// ----------------------------------------------------
// Firebase config (move secrets to .env / Vite variables)
// Vite env names used below: VITE_FIREBASE_*
// ----------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // harmless if left; not used
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate initialization during HMR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth and Firestore (these are used by your app)
let auth;
let db;
try {
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  // Very defensive: log via centralized handler, but don't crash the app
  try {
    errorHandler.handle(err, "FirebaseInit");
  } catch {
    // fallback to console
    console.error("Firebase initialization error:", err);
  }
}

// Initialize analytics when supported (non-blocking)
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          getAnalytics(app);
          if (import.meta.env.DEV) console.info("Firebase Analytics initialized");
        } catch (e) {
          // non-fatal
          if (import.meta.env.DEV) console.warn("Analytics init failed", e);
        }
      }
    })
    .catch(() => {
      if (import.meta.env.DEV) console.warn("Firebase analytics not supported in this environment");
    });
}

// Exports
export { app, auth, db };
export default app;
