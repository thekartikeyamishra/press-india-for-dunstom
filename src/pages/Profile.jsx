import React from 'react';
import { useSelector } from 'react-redux';
import { auth } from '../config/firebase';

const Profile = () => {
  const user = auth.currentUser;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="text-gray-600">Name</label>
            <p className="text-lg font-medium">{user?.displayName || 'User'}</p>
          </div>
          <div>
            <label className="text-gray-600">Email</label>
            <p className="text-lg font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-gray-600">Member Since</label>
            <p className="text-lg font-medium">
              {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;