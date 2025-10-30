// File: src/components/common/AuthGuard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';

const AuthGuard = ({ children, requireVerification = false }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    checkAuth();
  }, [user]);

  const checkAuth = async () => {
    try {
      if (!user) {
        setChecking(false);
        return;
      }

      if (requireVerification) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setVerified(userData.verified === true);
        }
      } else {
        setVerified(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
          <FaLock className="text-primary text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access this page.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              <FaSignInAlt />
              Login
            </button>
            
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              <FaUserPlus />
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but not verified
  if (requireVerification && !verified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
          <FaLock className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to verify your account to write articles.
          </p>
          
          <button
            onClick={() => navigate('/profile/verification')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Complete Verification
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;