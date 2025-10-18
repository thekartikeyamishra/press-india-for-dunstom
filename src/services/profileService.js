// File: src/services/profileService.js

import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { db, storage, auth } from '../config/firebase';

// ==========================================
// CONSTANTS & TYPES
// ==========================================
export const ACCOUNT_TYPES = {
  READER: 'reader',
  CREATOR: 'creator',
  JOURNALIST: 'journalist',
  ORGANIZATION: 'organization'
};

export const VERIFICATION_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

export const PROFILE_FIELDS = {
  BASIC: ['displayName', 'bio', 'location', 'website'],
  CONTACT: ['email', 'phone'],
  SOCIAL: ['twitter', 'linkedin', 'facebook', 'instagram'],
  PROFESSIONAL: ['organization', 'position', 'experience']
};

// ==========================================
// CREATE PROFILE (INITIAL SETUP)
// ==========================================
export const createProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const newProfile = {
      uid: userId,
      ...profileData,
      accountType: profileData.accountType || ACCOUNT_TYPES.READER,
      verificationStatus: VERIFICATION_STATUS.NONE,
      verified: false,
      profileCompleted: true,
      articlesRead: 0,
      bookmarksCount: 0,
      followersCount: 0,
      followingCount: 0,
      preferences: {
        language: profileData.language || 'en',
        categories: profileData.categories || [],
        notifications: true
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, newProfile);

    // Update Firebase Auth profile if displayName provided
    if (profileData.displayName && auth.currentUser) {
      await updateAuthProfile(auth.currentUser, {
        displayName: profileData.displayName
      });
    }

    return { success: true, profile: newProfile };
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

// ==========================================
// GET USER PROFILE
// ==========================================
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return {
      id: userSnap.id,
      ...userSnap.data()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Alias for getUserProfile (ProfileVerification uses this)
export const getProfile = getUserProfile;

// ==========================================
// CHECK IF USER IS VERIFIED
// ==========================================
export const isUserVerified = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return false;
    }

    const data = userSnap.data();
    return data.verified === true || data.verificationStatus === VERIFICATION_STATUS.VERIFIED;
  } catch (error) {
    console.error('Error checking user verification:', error);
    return false;
  }
};

// ==========================================
// GET OR CREATE PROFILE
// ==========================================
export const getOrCreateProfile = async (userId, defaultData = {}) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create default profile
      const defaultProfile = {
        uid: userId,
        accountType: ACCOUNT_TYPES.READER,
        verificationStatus: VERIFICATION_STATUS.NONE,
        verified: false,
        profileCompleted: false,
        articlesRead: 0,
        bookmarksCount: 0,
        preferences: {
          language: 'en',
          categories: []
        },
        ...defaultData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, defaultProfile);
      return defaultProfile;
    }

    return {
      id: userSnap.id,
      ...userSnap.data()
    };
  } catch (error) {
    console.error('Error getting or creating profile:', error);
    throw error;
  }
};

// ==========================================
// UPDATE USER PROFILE
// ==========================================
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);

    // Remove fields that shouldn't be updated directly
    const { verificationStatus: _verificationStatus, createdAt: _createdAt, uid: _uid, ...safeUpdates } = updates;

    await updateDoc(userRef, {
      ...safeUpdates,
      updatedAt: serverTimestamp()
    });

    // Update Firebase Auth profile if displayName changed
    if (updates.displayName && auth.currentUser) {
      await updateAuthProfile(auth.currentUser, {
        displayName: updates.displayName
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        uid: userId,
        ...updates,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    }
    
    throw error;
  }
};
// ==========================================
// UPDATE PROFILE FIELD
// ==========================================
export const updateProfileField = async (userId, field, value) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      [field]: value,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating profile field:', error);
    throw error;
  }
};

// ==========================================
// UPLOAD PROFILE PICTURE
// ==========================================
export const uploadProfilePicture = async (userId, file) => {
  try {
    if (!file) throw new Error('No file provided');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WEBP');
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File size must be less than 2MB');
    }

    const timestamp = Date.now();
    const filename = `profiles/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Update user profile with new photo URL
    await updateUserProfile(userId, { photoURL: downloadURL });

    // Update Firebase Auth profile
    if (auth.currentUser) {
      await updateAuthProfile(auth.currentUser, {
        photoURL: downloadURL
      });
    }

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// ==========================================
// DELETE PROFILE PICTURE
// ==========================================
export const deleteProfilePicture = async (userId, photoURL) => {
  try {
    if (photoURL) {
      try {
        const photoRef = ref(storage, photoURL);
        await deleteObject(photoRef);
      } catch (storageError) {
        console.warn('Could not delete photo from storage:', storageError);
      }
    }

    await updateUserProfile(userId, { photoURL: null });

    if (auth.currentUser) {
      await updateAuthProfile(auth.currentUser, {
        photoURL: null
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};

// ==========================================
// SUBMIT VERIFICATION REQUEST - INSTANT VERIFICATION
// ==========================================
export const submitVerificationRequest = async (userId, documents, autoVerify = true) => {
  try {
    const userRef = doc(db, 'users', userId);

    // Check if user document exists first
    const userSnap = await getDoc(userRef);
    
    // Prepare verification data with instant verification
    const verificationUpdate = {
      verificationStatus: autoVerify ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.PENDING,
      verified: autoVerify, // Set verified to true immediately
      verificationDocuments: documents,
      verificationSubmittedAt: serverTimestamp(),
      verifiedAt: autoVerify ? serverTimestamp() : null, // Set verified timestamp
      submittedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };

    if (!userSnap.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        uid: userId,
        createdAt: serverTimestamp(),
        ...verificationUpdate
      });
    } else {
      // Update existing document
      await updateDoc(userRef, verificationUpdate);
    }

    // Also create a verification record in subcollection for audit trail
    try {
      const verificationRef = doc(db, 'users', userId, 'verification', 'current');
      await setDoc(verificationRef, {
        documents: documents,
        status: autoVerify ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.PENDING,
        submittedAt: serverTimestamp(),
        verifiedAt: autoVerify ? serverTimestamp() : null,
        autoVerified: autoVerify
      });
    } catch (subError) {
      console.warn('Could not create verification subcollection:', subError);
      // Don't throw - main verification still succeeded
    }

    return { 
      success: true, 
      verified: autoVerify,
      message: autoVerify ? 'Account verified successfully!' : 'Verification request submitted'
    };
  } catch (error) {
    console.error('Error submitting verification:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please ensure you are logged in.');
    }
    
    throw error;
  }
};

// ==========================================
// GET VERIFICATION STATUS
// ==========================================
export const getVerificationStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        status: VERIFICATION_STATUS.NONE,
        verified: false,
        documents: null,
        submittedAt: null,
        verifiedAt: null,
        reviewNotes: null
      };
    }

    const data = userSnap.data();
    return {
      status: data.verificationStatus || VERIFICATION_STATUS.NONE,
      verified: data.verified || false,
      documents: data.verificationDocuments || null,
      submittedAt: data.submittedAt || data.verificationSubmittedAt?.toDate?.() || null,
      verifiedAt: data.verifiedAt?.toDate?.() || null,
      reviewNotes: data.reviewNotes || data.rejectionReason || null
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return {
      status: VERIFICATION_STATUS.NONE,
      verified: false,
      documents: null,
      submittedAt: null,
      verifiedAt: null,
      reviewNotes: null
    };
  }
};

// ==========================================
// UPDATE USER PREFERENCES
// ==========================================
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      preferences: preferences,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

// ==========================================
// UPDATE ACCOUNT TYPE
// ==========================================
export const updateAccountType = async (userId, accountType) => {
  try {
    // Validate account type
    if (!Object.values(ACCOUNT_TYPES).includes(accountType)) {
      throw new Error('Invalid account type');
    }

    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      accountType: accountType,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating account type:', error);
    throw error;
  }
};
// ==========================================
// COMPLETE PROFILE SETUP
// ==========================================
export const completeProfileSetup = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updates = {
      ...profileData,
      profileCompleted: true,
      profileCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: userId,
        createdAt: serverTimestamp(),
        ...updates
      });
    } else {
      await updateDoc(userRef, updates);
    }

    return { success: true };
  } catch (error) {
    console.error('Error completing profile setup:', error);
    throw error;
  }
};

// ==========================================
// CHECK IF PROFILE IS COMPLETE
// ==========================================
export const isProfileComplete = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return false;
    }

    const data = userSnap.data();
    return data.profileCompleted === true;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
};

// ==========================================
// CHECK IF USERNAME IS AVAILABLE
// ==========================================
export const isUsernameAvailable = async (username) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
};

// ==========================================
// INCREMENT ARTICLES READ
// ==========================================
export const incrementArticlesRead = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentCount = userSnap.data().articlesRead || 0;
      await updateDoc(userRef, {
        articlesRead: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error incrementing articles read:', error);
    // Don't throw - this is not critical
  }
};

// ==========================================
// UPDATE BOOKMARKS COUNT
// ==========================================
export const updateBookmarksCount = async (userId, increment = true) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentCount = userSnap.data().bookmarksCount || 0;
      const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      await updateDoc(userRef, {
        bookmarksCount: newCount,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating bookmarks count:', error);
    // Don't throw - this is not critical
  }
};

// ==========================================
// DELETE USER PROFILE
// ==========================================
export const deleteUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Get profile to delete photo if exists
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.photoURL) {
        await deleteProfilePicture(userId, userData.photoURL);
      }
    }

    // Delete user document
    await deleteDoc(userRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};

// ==========================================
// GET PUBLIC PROFILE (for viewing other users)
// ==========================================
export const getPublicProfile = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile) return null;

    // Return only public fields
    return {
      uid: profile.uid,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      bio: profile.bio,
      accountType: profile.accountType,
      verificationStatus: profile.verificationStatus,
      verified: profile.verified,
      location: profile.location,
      website: profile.website,
      social: profile.social,
      articlesRead: profile.articlesRead,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      createdAt: profile.createdAt
    };
  } catch (error) {
    console.error('Error getting public profile:', error);
    throw error;
  }
};

// ==========================================
// ADMIN: MANUALLY VERIFY USER
// ==========================================
export const manuallyVerifyUser = async (userId, verified = true, notes = '') => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      verified: verified,
      verificationStatus: verified ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED,
      verifiedAt: verified ? serverTimestamp() : null,
      reviewNotes: notes,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error manually verifying user:', error);
    throw error;
  }
};