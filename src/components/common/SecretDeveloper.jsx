// File: src/components/common/SecretDeveloper.jsx

import { useEffect } from 'react';

const SecretDeveloper = () => {
  useEffect(() => {
    let secretCode = '';
    const targetCode = 'DUNSTOM';
    let timeout;

    const handleKeyPress = (e) => {
      // Only handle letter keys
      if (e.key && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        secretCode += e.key.toUpperCase();

        // Clear timeout if exists
        if (timeout) clearTimeout(timeout);

        // Reset after 2 seconds of no typing
        timeout = setTimeout(() => {
          secretCode = '';
        }, 2000);

        // Check if code matches
        if (secretCode === targetCode) {
          console.log('%c🎉 DUNSTOM DEVELOPER MODE ACTIVATED! 🎉', 
            'background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; padding: 20px; font-size: 20px; font-weight: bold; border-radius: 10px;'
          );
          console.log('%c👨‍💻 Developed by: DUNSTOM', 
            'color: #6366f1; font-size: 16px; font-weight: bold;'
          );
          console.log('%c📧 Contact: dunstom@example.com', 
            'color: #8b5cf6; font-size: 14px;'
          );
          console.log('%c🌐 Website: https://dunstom.com', 
            'color: #6366f1; font-size: 14px;'
          );
          
          // Reset code
          secretCode = '';
        }

        // Keep only last 10 characters to prevent memory issues
        if (secretCode.length > 10) {
          secretCode = secretCode.slice(-10);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return null;
};

export default SecretDeveloper;
