import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { logOut } from '../../services/authService';
import { FaUser, FaSignOutAlt, FaNewspaper, FaExclamationTriangle, FaBars, FaTimes, FaSearch, FaCompass } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Header = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully!');
      navigate('/auth');
    } catch {
      toast.error('Error logging out');
    }
  };

  return (
    <header className="bg-gradient-to-r from-primary to-secondary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-white hover:opacity-90 transition whitespace-nowrap">
            Press India
          </Link>
          
          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, news, topics..."
                className="w-full px-4 py-2 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-accent transition"
              >
                <FaSearch size={18} />
              </button>
            </div>
          </form>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 whitespace-nowrap">
            <Link 
              to="/" 
              className="text-white hover:text-accent transition flex items-center gap-2"
            >
              <FaNewspaper />
              News Feed
            </Link>
            
            <Link 
              to="/explore" 
              className="text-white hover:text-accent transition flex items-center gap-2"
            >
              <FaCompass />
              Explore
            </Link>
            
            <Link 
              to="/articles/my" 
              className="text-white hover:text-accent transition flex items-center gap-2"
            >
              <FaNewspaper />
              My Articles
            </Link>
            
            <Link 
              to="/articles/new" 
              className="text-white hover:text-accent transition flex items-center gap-2"
            >
              <FaNewspaper />
              Write Article
            </Link>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="font-medium">{user?.displayName || 'User'}</span>
            </div>
            
            <Link 
              to="/profile" 
              className="text-white hover:text-accent transition"
              title="Profile"
            >
              <FaUser size={20} />
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-opacity-90 flex items-center space-x-2 transition"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white text-2xl"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white border-opacity-20">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, news..."
                  className="w-full px-4 py-2 pr-10 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-accent transition"
                >
                  <FaSearch size={18} />
                </button>
              </div>
            </form>
            
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-accent transition flex items-center gap-2 py-2"
              >
                <FaNewspaper />
                News Feed
              </Link>
              
              <Link 
                to="/explore" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-accent transition flex items-center gap-2 py-2"
              >
                <FaCompass />
                Explore
              </Link>
              
              <Link 
                to="/articles/my" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-accent transition flex items-center gap-2 py-2"
              >
                <FaNewspaper />
                My Articles
              </Link>
              
              <Link 
                to="/articles/new" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-accent transition flex items-center gap-2 py-2"
              >
                <FaNewspaper />
                Write Article
              </Link>
              
              <Link 
                to="/profile" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-accent transition flex items-center gap-2 py-2"
              >
                <FaUser />
                Profile
              </Link>
              
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-white hover:text-accent transition flex items-center gap-2 py-2 text-left"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
