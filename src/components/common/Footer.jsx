import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaShieldAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Press India</h3>
            <p className="text-gray-400 text-sm mb-4">
              India's trusted platform for verified news and citizen journalism.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <FaShieldAlt className="text-green-500" />
              <span>Verified & Secure Platform</span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-white transition">News Feed</Link></li>
              <li><Link to="/articles/my" className="hover:text-white transition">My Articles</Link></li>
              <li><Link to="/articles/new" className="hover:text-white transition">Write Article</Link></li>
              <li><Link to="/profile" className="hover:text-white transition">Profile</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal & Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/legal/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/legal/content-policy" className="hover:text-white transition">Content Policy</Link></li>
              <li><Link to="/grievances/report" className="hover:text-white transition">Report Issue</Link></li>
              <li><Link to="/legal/grievance-officer" className="hover:text-white transition">Grievance Officer</Link></li>
            </ul>
          </div>
          
          {/* Social & Contact */}
          <div>
            <h4 className="font-semibold mb-4">Connect With Us</h4>
            <div className="flex space-x-4 mb-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <FaFacebook size={24} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <FaTwitter size={24} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <FaInstagram size={24} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <FaLinkedin size={24} />
              </a>
            </div>
            <div className="text-gray-400 text-sm space-y-1">
              <p>Email: support@pressindia.com</p>
              <p>Grievance: grievance@pressindia.com</p>
              <p>Response Time: 15 days</p>
            </div>
          </div>
        </div>
        
        {/* Legal Disclaimer */}
        <div className="border-t border-gray-700 pt-8">
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-white">Legal Disclaimer:</strong> Press India is an intermediary platform under Section 79 of the IT Act, 2000. 
              User-generated content does not represent the views of Press India. We are not responsible for the accuracy of user-submitted articles. 
              All content is subject to review and moderation. Press India takes down unlawful content expeditiously upon receiving actual knowledge.
            </p>
          </div>
          
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Press India. All rights reserved.</p>
            <p className="mt-2">
              Compliant with IT Act 2000, IT Rules 2021, and Press Council Guidelines
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;