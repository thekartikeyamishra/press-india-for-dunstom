import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaFilter, FaNewspaper, FaUser } from 'react-icons/fa';

const CATEGORIES = ['all', 'india', 'world', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];

const SearchBar = ({ onSearch, onFilterChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    type: 'all', // all, news, user
    sortBy: 'recent' // recent, popular, trending
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const popularSearches = [
        'Breaking News', 'India Politics', 'Technology Updates', 'Sports News',
        'Business Today', 'Entertainment', 'Health Tips', 'Science News'
      ];
      const filtered = popularSearches.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery, filters);
      setShowSuggestions(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    onSearch?.('', filters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-lg shadow-md border-2 border-gray-200 focus-within:border-primary transition-all">
          <FaSearch className="ml-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search articles, news, topics..."
            className="flex-1 px-4 py-3 outline-none rounded-lg"
          />
          {query && (
            <button onClick={clearSearch} className="p-2 hover:bg-gray-100 rounded-full mr-2">
              <FaTimes className="text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 mr-2 rounded-lg transition-colors ${showFilters ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
          >
            <FaFilter />
          </button>
          <button
            onClick={() => handleSearch()}
            className="bg-primary text-white px-6 py-3 rounded-r-lg hover:opacity-90 transition-all font-semibold"
          >
            Search
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
              >
                <FaSearch className="text-gray-400 text-sm" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Filters</h3>
          
          {/* Category Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange('category', cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    filters.category === cat
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('type', 'all')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filters.type === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('type', 'news')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  filters.type === 'news'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaNewspaper /> News
              </button>
              <button
                onClick={() => handleFilterChange('type', 'user')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  filters.type === 'user'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaUser /> User Articles
              </button>
            </div>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('sortBy', 'recent')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filters.sortBy === 'recent'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => handleFilterChange('sortBy', 'popular')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filters.sortBy === 'popular'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => handleFilterChange('sortBy', 'trending')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filters.sortBy === 'trending'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {CATEGORIES.slice(1, 6).map(cat => (
          <button
            key={cat}
            onClick={() => {
              handleFilterChange('category', cat);
              setShowFilters(false);
            }}
            className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
