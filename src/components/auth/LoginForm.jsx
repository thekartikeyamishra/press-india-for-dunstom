// File: src/components/auth/LoginForm.jsx
// ============================================
// LOGIN FORM - FIXED WITH NAVIGATION DEBUG
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ← CRITICAL: Must import this!
import { signIn } from '../../services/authService';
import { FaEye, FaEyeSlash, FaSpinner, FaWifi } from 'react-icons/fa';
import toast from 'react-hot-toast';

const LoginForm = ({ onSwitchToSignup, onSwitchToForgot, redirectTo }) => {
  const navigate = useNavigate(); // ← CRITICAL: Must use this hook!
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check network connection
  const checkConnection = () => {
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network.', {
        icon: '🌐',
        duration: 4000
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Check network before attempting
    if (!checkConnection()) {
      return;
    }

    setLoading(true);
    setRetrying(false);
    
    try {
      console.log('🔐 Attempting login...');
      
      // Show loading toast
      const loadingToast = toast.loading('Signing you in...', {
        duration: 5000
      });
      
      // Try to sign in
      const user = await signIn(email, password);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Success!
      toast.success('Login successful! Redirecting... 🎉', {
        duration: 2000
      });
      
      console.log('✅ Login successful', user);
      console.log('🔍 Navigate function available:', typeof navigate); // Debug
      
      // ✅ FIXED: Navigate after successful login
      console.log('⏳ Waiting 1 second before redirect...');
      
      setTimeout(() => {
        // Get redirect URL from query params or props
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || redirectTo || '/';
        
        console.log('🎯 Redirect destination:', redirect);
        console.log('🚀 Calling navigate...');
        
        try {
          // Navigate to destination
          navigate(redirect, { replace: true });
          console.log('✅ Navigate called successfully');
        } catch (navError) {
          console.error('❌ Navigate error:', navError);
          // Fallback to window.location
          console.log('⚠️ Using fallback: window.location.href');
          window.location.href = redirect;
        }
      }, 1000); // 1 second delay to show success message
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle specific Firebase Authentication errors
      switch (error.code) {
        case 'auth/network-request-failed':
          toast.error(
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FaWifi className="text-red-500" />
                <span className="font-semibold">Connection Failed</span>
              </div>
              <p className="text-sm">
                Unable to reach authentication server. Please check your internet connection and try again.
              </p>
            </div>,
            {
              duration: 5000,
              style: {
                maxWidth: '400px'
              }
            }
          );
          setRetrying(true);
          break;
          
        case 'auth/user-not-found':
          toast.error(
            <div>
              <p className="font-semibold">No Account Found</p>
              <p className="text-sm mt-1">No account exists with this email. Would you like to sign up?</p>
            </div>,
            { duration: 4000 }
          );
          setTimeout(() => onSwitchToSignup && onSwitchToSignup(), 2000);
          break;
          
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          toast.error(
            <div>
              <p className="font-semibold">Incorrect Password</p>
              <p className="text-sm mt-1">Please try again or reset your password.</p>
            </div>,
            { duration: 4000 }
          );
          break;
          
        case 'auth/invalid-email':
          toast.error('Invalid email address format.');
          break;
          
        case 'auth/user-disabled':
          toast.error(
            <div>
              <p className="font-semibold">Account Disabled</p>
              <p className="text-sm mt-1">This account has been disabled. Please contact support.</p>
            </div>,
            { duration: 5000 }
          );
          break;
          
        case 'auth/too-many-requests':
          toast.error(
            <div>
              <p className="font-semibold">Too Many Attempts</p>
              <p className="text-sm mt-1">Too many failed login attempts. Please try again later or reset your password.</p>
            </div>,
            { duration: 5000 }
          );
          break;
          
        case 'auth/operation-not-allowed':
          toast.error('Email/password sign-in is not enabled. Please contact support.');
          break;
          
        default: {
          const errorMessage = error.message || 'Login failed. Please try again.';
          
          if (errorMessage.toLowerCase().includes('network') || 
              errorMessage.toLowerCase().includes('connection')) {
            toast.error(
              <div>
                <p className="font-semibold">Connection Error</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>,
              { duration: 5000 }
            );
            setRetrying(true);
          } else if (errorMessage.toLowerCase().includes('user') || 
                     errorMessage.toLowerCase().includes('not found')) {
            toast.error('No account found. Please sign up first.');
            setTimeout(() => onSwitchToSignup && onSwitchToSignup(), 2000);
          } else {
            toast.error(errorMessage);
          }
          break;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Retry button handler
  const handleRetry = () => {
    setRetrying(false);
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Press India
        </h1>
        <p className="text-gray-600">India's Highest Rated News App</p>
        <p className="text-sm text-gray-500 mt-1">Login to continue</p>
      </div>

      {/* Network Status Warning */}
      {!navigator.onLine && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FaWifi className="text-red-500 text-xl" />
            <div>
              <p className="text-sm font-semibold text-red-800">No Internet Connection</p>
              <p className="text-xs text-red-600 mt-1">Please check your network and try again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Retry Button */}
      {retrying && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-800">Connection Failed</p>
              <p className="text-xs text-yellow-600 mt-1">Click retry to try again</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
            placeholder="Enter your email"
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        {/* Password Field */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter your password"
              required
              minLength={6}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
              tabIndex={-1}
              disabled={loading}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <button 
            type="button" 
            onClick={onSwitchToForgot} 
            className="text-secondary hover:text-primary text-sm font-medium transition-colors"
            disabled={loading}
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email || !password || !navigator.onLine}
          className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={onSwitchToSignup} 
            className="text-primary font-semibold hover:underline transition-colors"
            disabled={loading}
          >
            Sign Up
          </button>
        </p>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 text-center">
          🔒 Your data is secure and encrypted
        </p>
      </div>

      {/* Troubleshooting Tips */}
      {retrying && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">Troubleshooting Tips:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Try disabling VPN if you're using one</li>
            <li>• Clear browser cache and cookies</li>
            <li>• Try a different browser</li>
            <li>• Refresh the page and try again</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
