// E:\press-india\src\pages\NotFound.jsx
// ============================================
// 404 NOT FOUND PAGE
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <FaExclamationTriangle className="text-6xl text-yellow-500 mx-auto mb-6" />
        
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition font-semibold"
        >
          <FaHome />
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;