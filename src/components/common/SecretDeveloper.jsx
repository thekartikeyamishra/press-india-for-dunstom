import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const SecretDeveloper = () => {
  const [showSignature, setShowSignature] = useState(false);
  const [keySequence, setKeySequence] = useState('');

  useEffect(() => {
    const handleKeyPress = (e) => {
      const newSequence = (keySequence + e.key.toUpperCase()).slice(-20);
      setKeySequence(newSequence);

      if (newSequence.includes('VPMSMKM')) {
        setShowSignature(true);
        setKeySequence('');
        setTimeout(() => setShowSignature(false), 5000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keySequence]);

  return (
    <AnimatePresence>
      {showSignature && (
        <Motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <Motion.div 
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white px-12 py-8 rounded-2xl shadow-2xl"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(147, 51, 234, 0.5)',
                '0 0 40px rgba(236, 72, 153, 0.5)',
                '0 0 20px rgba(147, 51, 234, 0.5)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Motion.h1 
              className="text-4xl font-bold text-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🚀 Developed by Kartikeya Mishra 🚀
            </Motion.h1>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default SecretDeveloper;