// File: src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FaUser, FaEnvelope, FaCheckCircle, FaTimesCircle, FaClock, FaShieldAlt } from 'react-icons/fa';
import UserVerification from '../components/verification/UserVerification';
import Loader from '../components/common/Loader';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          
          // Show verification if status is not 'verified'
          if (!userDoc.data().verificationStatus || userDoc.data().verificationStatus === 'none') {
            setShowVerification(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Handle verification completion
  const handleVerificationComplete = () => {
    setShowVerification(false);
    // Refresh user data
    window.location.reload();
  };

  if (loading) {
    return <Loader />;
  }

  // Get verification status badge
  const getVerificationBadge = () => {
    const status = userData?.verificationStatus || 'none';
    
    const badges = {
      verified: {
        icon: <FaCheckCircle className="text-xl" />,
        text: 'Verified',
        bg: 'bg-green-100',
        text_color: 'text-green-700',
        border: 'border-green-300'
      },
      pending: {
        icon: <FaClock className="text-xl" />,
        text: 'Pending Verification',
        bg: 'bg-yellow-100',
        text_color: 'text-yellow-700',
        border: 'border-yellow-300'
      },
      rejected: {
        icon: <FaTimesCircle className="text-xl" />,
        text: 'Verification Rejected',
        bg: 'bg-red-100',
        text_color: 'text-red-700',
        border: 'border-red-300'
      },
      none: {
        icon: <FaShieldAlt className="text-xl" />,
        text: 'Not Verified',
        bg: 'bg-gray-100',
        text_color: 'text-gray-700',
        border: 'border-gray-300'
      }
    };

    const badge = badges[status];

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${badge.bg} ${badge.text_color} ${badge.border}`}>
        {badge.icon}
        <span className="font-semibold text-sm">{badge.text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Show verification form if needed */}
        {showVerification ? (
          <UserVerification 
            user={user} 
            onVerificationComplete={handleVerificationComplete}
          />
        ) : (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    {user?.displayName || 'User'}
                  </h1>
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaEnvelope />
                      <span>{user?.email}</span>
                    </div>
                    {getVerificationBadge()}
                  </div>
                  
                  {/* Member Since */}
                  <p className="text-sm text-gray-500">
                    Member since {new Date(userData?.createdAt || Date.now()).toLocaleDateString('en-IN', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Info */}
            {userData?.verificationStatus && userData.verificationStatus !== 'none' && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-primary" />
                  Verification Status
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-semibold capitalize">
                      {userData?.verificationMethod?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-semibold">
                      {userData?.verificationSubmittedAt 
                        ? new Date(userData.verificationSubmittedAt).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </span>
                  </div>

                  {userData?.verificationStatus === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-yellow-800">
                        Your verification is being reviewed. You'll receive a notification once it's processed (typically within 24-48 hours).
                      </p>
                    </div>
                  )}

                  {userData?.verificationStatus === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-red-800 mb-3">
                        {userData?.rejectionReason || 'Your verification was rejected. Please submit valid documents.'}
                      </p>
                      <button
                        onClick={() => setShowVerification(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90"
                      >
                        Resubmit Documents
                      </button>
                    </div>
                  )}

                  {userData?.verificationStatus === 'verified' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <FaCheckCircle />
                        Your account is verified! You have access to all features.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {userData?.articlesRead || 0}
                </div>
                <div className="text-gray-600">Articles Read</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {userData?.bookmarksCount || 0}
                </div>
                <div className="text-gray-600">Bookmarks</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {userData?.preferences?.categories?.length || 0}
                </div>
                <div className="text-gray-600">Preferred Topics</div>
              </div>
            </div>

            {/* Action Button for Unverified Users */}
            {(!userData?.verificationStatus || userData.verificationStatus === 'none') && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-bold text-blue-800 mb-2">
                  Verify Your Account
                </h3>
                <p className="text-blue-700 mb-4">
                  Get verified to unlock premium features and build trust in the community
                </p>
                <button
                  onClick={() => setShowVerification(true)}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90"
                >
                  Start Verification
                </button>
              </div>
            )}
          </Motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;