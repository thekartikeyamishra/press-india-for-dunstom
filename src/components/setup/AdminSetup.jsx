// File: src/components/setup/AdminSetup.jsx

import React, { useState } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FaCrown } from 'react-icons/fa';

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [setupCode, setSetupCode] = useState('');

  // Change this secret code to whatever you want
  const SECRET_SETUP_CODE = 'PRESS-INDIA-ADMIN-2025';

  const handleSetupAdmin = async () => {
    if (setupCode !== SECRET_SETUP_CODE) {
      toast.error('Invalid setup code');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const userRef = doc(db, 'users', user.uid);

      await updateDoc(userRef, {
        role: 'super_admin',
        verified: true,
        verificationStatus: 'verified',
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('🎉 You are now a Super Admin!');
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.href = '/users';
      }, 2000);

    } catch (error) {
      console.error('Error setting up admin:', error);
      toast.error('Failed to setup admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCrown className="text-white text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Setup
          </h1>
          <p className="text-gray-600">
            Enter the secret code to become Super Admin
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setup Code
            </label>
            <input
              type="password"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Enter secret setup code"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSetupAdmin}
            disabled={loading || !setupCode}
            className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Setting up...' : 'Setup Super Admin'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            ⚠️ This page should be removed after initial setup for security
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;