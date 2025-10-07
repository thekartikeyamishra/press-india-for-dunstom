import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { logOut } from '../../services/authService';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Header = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully!');
      navigate('/auth');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  return (
    <header className="bg-gradient-to-r from-primary to-secondary shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white">
            Press India
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>{user?.displayName || 'User'}</span>
            </div>
            
            <Link to="/profile" className="text-white hover:text-accent">
              <FaUser size={20} />
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;