import React, { useState, useEffect } from 'react';
import { FaNewspaper, FaSync, FaClock, FaExternalLinkAlt } from 'react-icons/fa';
import newsService from '../services/newsService';
import CategoryFilter from './CategoryFilter';
import NewsCard from './NewsCard';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');
  const [language, setLanguage] = useState('en');
  const [viewMode, setViewMode] = useState('grid');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Real-time subscription to news updates
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = newsService.subscribeToNews(
      category,
      language,
      (newArticles) => {
        setArticles(newArticles);
        setLastUpdate(new Date());
        setLoading(false);
      }
    );

    // Initial fetch and cache
    newsService.refreshNews(category, language)
      .finally(() => setLoading(false));

    return () => unsubscribe();
  }, [category, language]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh(true);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [category, language]);

  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    
    try {
      await newsService.refreshNews(category, language);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const minutes = Math.floor((Date.now() - lastUpdate) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaNewspaper className="text-6xl text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading latest news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FaNewspaper className="text-primary text-2xl" />
              <div>
                <h1 className="text-xl font-bold">Press India</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaClock />
                  <span>Updated {formatLastUpdate()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-l-lg transition ${
                    viewMode === 'grid' ? 'bg-primary text-white' : ''
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-r-lg transition ${
                    viewMode === 'list' ? 'bg-primary text-white' : ''
                  }`}
                >
                  List
                </button>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={() => handleRefresh()}
                disabled={refreshing}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 flex items-center gap-2 disabled:opacity-50 transition"
              >
                <FaSync className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Category Filter */}
        <CategoryFilter 
          activeCategory={category} 
          onCategoryChange={handleCategoryChange} 
        />
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* News Stats */}
        <div className="bg-white rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaNewspaper className="text-primary" />
            <span className="font-semibold">
              {articles.length} Article{articles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Sourced from PTI & NewsAPI
          </div>
        </div>

        {/* Articles Grid/List */}
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <FaNewspaper className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No articles available</p>
            <button
              onClick={() => handleRefresh()}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
            >
              Refresh News
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }>
            {articles.map((article) => (
              <NewsCard 
                key={article.id} 
                article={article} 
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;