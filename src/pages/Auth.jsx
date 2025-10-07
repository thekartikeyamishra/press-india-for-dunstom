import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import ForgotPassword from '../components/auth/ForgotPassword';

const Auth = () => {
  const [currentView, setCurrentView] = useState('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {currentView === 'login' && (
            <LoginForm 
              onSwitchToSignup={() => setCurrentView('signup')}
              onSwitchToForgot={() => setCurrentView('forgot')}
            />
          )}
          {currentView === 'signup' && (
            <SignupForm onSwitchToLogin={() => setCurrentView('login')} />
          )}
          {currentView === 'forgot' && (
            <ForgotPassword onSwitchToLogin={() => setCurrentView('login')} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Auth;