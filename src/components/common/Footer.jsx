import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Press India</h3>
            <p className="text-gray-400">India's Highest Rated News App</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>About Us</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Follow Us</h4>
            <div className="flex space-x-4 text-gray-400">
              <span>Facebook</span>
              <span>Twitter</span>
              <span>Instagram</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2025 Press India. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
