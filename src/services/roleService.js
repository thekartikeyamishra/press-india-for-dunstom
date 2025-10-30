// File: src/services/roleService.js

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES, ROLE_PERMISSIONS } from '../config/constants';

// ==========================================
// GET USER ROLE
// ==========================================
export const getUserRole = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return ROLES.READER; // Default role
    }

    const userData = userSnap.data();
    return userData.role || userData.accountType || ROLES.READER;
  } catch (error) {
    console.error('Error getting user role:', error);
    return ROLES.READER;
  }
};

// ==========================================
// CHECK USER PERMISSION
// ==========================================
export const checkPermission = async (userId, permission) => {
  try {
    const role = await getUserRole(userId);
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.reader;
    
    return permissions[permission] === true;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// ==========================================
// GET USER PERMISSIONS
// ==========================================
export const getUserPermissions = async (userId) => {
  try {
    const role = await getUserRole(userId);
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.reader;
  } catch (error) {
    console.error('Error getting permissions:', error);
    return ROLE_PERMISSIONS.reader;
  }
};

// ==========================================
// ASSIGN ROLE (ADMIN ONLY)
// ==========================================
export const assignRole = async (userId, newRole, assignedBy) => {
  try {
    // Validate role
    if (!Object.values(ROLES).includes(newRole)) {
      throw new Error('Invalid role');
    }

    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      role: newRole,
      roleAssignedBy: assignedBy,
      roleAssignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, role: newRole };
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};

// ==========================================
// CHECK IF USER CAN WRITE ARTICLES
// ==========================================
export const canUserWriteArticles = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { canWrite: false, reason: 'User profile not found' };
    }

    const userData = userSnap.data();

    // Check verification
    if (!userData.verified) {
      return { 
        canWrite: false, 
        reason: 'Account not verified. Please complete verification first.',
        needsVerification: true
      };
    }

    // Check role permissions
    const role = userData.role || userData.accountType || ROLES.READER;
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.reader;

    if (!permissions.canWrite) {
      return { 
        canWrite: false, 
        reason: 'Your account type does not have permission to write articles.',
        needsUpgrade: true
      };
    }

    return { canWrite: true, reason: null };
  } catch (error) {
    console.error('Error checking write permission:', error);
    return { canWrite: false, reason: 'Error checking permissions' };
  }
};

// ==========================================
// GET ROLE DISPLAY INFO
// ==========================================
export const getRoleDisplayInfo = (role) => {
  const roleInfo = {
    reader: {
      name: 'Reader',
      badge: '📖',
      color: 'gray',
      description: 'Can read articles'
    },
    creator: {
      name: 'Creator',
      badge: '✍️',
      color: 'blue',
      description: 'Can write and publish articles'
    },
    journalist: {
      name: 'Journalist',
      badge: '📰',
      color: 'green',
      description: 'Verified media professional'
    },
    organization: {
      name: 'Organization',
      badge: '🏢',
      color: 'purple',
      description: 'Business or media organization'
    },
    editor: {
      name: 'Editor',
      badge: '📝',
      color: 'orange',
      description: 'Can review and edit articles'
    },
    admin: {
      name: 'Admin',
      badge: '👑',
      color: 'red',
      description: 'Full platform access'
    }
  };

  return roleInfo[role] || roleInfo.reader;
};