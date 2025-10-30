// File: src/services/authService.js
// ============================================
// AUTHENTICATION SERVICE - FIXED
// Network error handling, retry logic, production ready
// ============================================

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// ✅ FIXED: Helper function to retry failed requests
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry for these errors
      const noRetryErrors = [
        'auth/invalid-email',
        'auth/user-disabled',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/invalid-credential',
        'auth/email-already-in-use',
        'auth/weak-password'
      ];
      
      if (noRetryErrors.includes(error.code)) {
        console.log('❌ No retry for error:', error.code);
        throw error;
      }
      
      // Retry for network errors
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  console.error('❌ All retry attempts failed');
  throw lastError;
};

// ✅ FIXED: Check if user exists in Firestore
export const checkUserExists = async (email) => {
  try {
    // Try to find user by email query
    const usersRef = doc(db, 'users', email);
    const userDoc = await getDoc(usersRef);
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user:', error);
    return false;
  }
};

// ✅ FIXED: Sign up with retry logic
export const signUp = async (email, password, name) => {
  try {
    console.log('📝 Creating user account...');
    
    // Set persistence
    await setPersistence(auth, browserLocalPersistence);
    
    // Create user with retry
    const userCredential = await retryOperation(async () => {
      return await createUserWithEmailAndPassword(auth, email, password);
    });
    
    console.log('✅ User account created');
    
    // Update profile
    await updateProfile(userCredential.user, { displayName: name });
    console.log('✅ Profile updated');
    
    // Create Firestore document with retry
    try {
      await retryOperation(async () => {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          name,
          role: 'user', // Default role
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          verificationStatus: 'none',
          verificationMethod: null,
          verificationDocument: null,
          verificationSubmittedAt: null,
          articlesRead: 0,
          bookmarksCount: 0,
          preferences: {
            language: 'en',
            categories: [],
            notifications: true
          },
          isActive: true
        });
      });
      
      console.log('✅ User document created in Firestore');
    } catch (firestoreError) {
      console.error('⚠️ Firestore write error:', firestoreError);
      // Continue anyway - auth succeeded
      // User can still use the app, document can be created later
    }
    
    return userCredential.user;
    
  } catch (error) {
    console.error('❌ Sign up error:', error);
    throw error;
  }
};

// ✅ FIXED: Sign in with retry logic and better error handling
export const signIn = async (email, password) => {
  try {
    console.log('🔐 Attempting to sign in...');
    
    // Set persistence
    await setPersistence(auth, browserLocalPersistence);
    
    // Sign in with retry logic
    const userCredential = await retryOperation(async () => {
      return await signInWithEmailAndPassword(auth, email, password);
    }, 3, 1000); // 3 retries, 1 second initial delay
    
    console.log('✅ Sign in successful');
    
    // Update last login time (optional)
    try {
      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (updateError) {
      console.error('⚠️ Could not update last login:', updateError);
      // Don't throw - login was successful
    }
    
    return userCredential.user;
    
  } catch (error) {
    console.error('❌ Sign in error:', error.code, error.message);
    
    // Enhance error messages
    if (error.code === 'auth/network-request-failed') {
      const enhancedError = new Error(
        'Unable to connect to authentication server. Please check your internet connection and try again.'
      );
      enhancedError.code = error.code;
      throw enhancedError;
    }
    
    throw error;
  }
};

// ✅ FIXED: Log out
export const logOut = async () => {
  try {
    console.log('👋 Logging out...');
    await signOut(auth);
    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
};

// ✅ FIXED: Reset password with retry
export const resetPassword = async (email) => {
  try {
    console.log('📧 Sending password reset email...');
    
    await retryOperation(async () => {
      await sendPasswordResetEmail(auth, email);
    });
    
    console.log('✅ Password reset email sent');
  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    }
    
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw error;
  }
};

// ✅ NEW: Check authentication status
export const checkAuthStatus = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// ✅ NEW: Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// ✅ NEW: Refresh user token
export const refreshUserToken = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await user.getIdToken(true);
      console.log('✅ Token refreshed');
    } catch (error) {
      console.error('❌ Token refresh error:', error);
    }
  }
};

export default {
  checkUserExists,
  signUp,
  signIn,
  logOut,
  resetPassword,
  checkAuthStatus,
  getCurrentUser,
  refreshUserToken
};
