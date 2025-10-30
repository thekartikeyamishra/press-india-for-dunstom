// E:\press-india\src\components\home\MixedFeed.jsx
// ============================================
// MIXED FEED - Google News + User Articles
// Complete Production Ready
// ============================================

import { useState, useEffect } from 'react';
import newsService from '../../services/newsService';
import articleService from '../../services/articleService';
import NewsCard from '../news/NewsCard';
import { FaNewspaper, FaSync, FaFilter, FaUser, FaGlobe, FaTh, FaList } from 'react-icons/fa';
import toast from 'react-hot-toast';

const MixedFeed = ({ category = 'all' }) => {
  const [googleNews, setGoogleNews] = useState([]);
  const [userArticles, setUserArticles] = useState([]);
  const [displayArticles, setDisplayArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [contentFilter, setContentFilter] = useState('all'); // 'all', 'news', 'user'

  // Load both Google News and User Articles
  const loadAllContent = async () => {
    try {
      setLoading(true);
      setError(null);

      let googleNewsData = [];
      let userArticlesData = [];

      // Fetch Google News
      try {
        googleNewsData = await newsService.getNews(category);
        const normalizedGoogleNews = normalizeArticles(googleNewsData, 'google');
        setGoogleNews(normalizedGoogleNews);
        console.log('Fetched Google News:', normalizedGoogleNews.length);
      } catch (err) {
        console.log('Google News not available:', err.message);
      }
      
      // Fetch User Articles from Firebase
      try {
        userArticlesData = await articleService.getPublishedArticles(category);
        const normalizedUserArticles = normalizeArticles(userArticlesData, 'user');
        setUserArticles(normalizedUserArticles);
        console.log('Fetched user articles:', normalizedUserArticles.length);
      } catch (err) {
        console.log('User articles not available:', err.message);
      }

      // Apply current filter
      applyFilter(googleNewsData, userArticlesData, contentFilter);

    } catch (err) {
      console.error('Error loading content:', err);
      setError(err.message);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply content filter
   */
  const applyFilter = (googleNewsData, userArticlesData, filter) => {
    const normalizedGoogle = normalizeArticles(googleNewsData, 'google');
    const normalizedUser = normalizeArticles(userArticlesData, 'user');
    
    let filtered = [];

    switch (filter) {
      case 'news':
        filtered = normalizedGoogle;
        break;
      
      case 'user':
        filtered = normalizedUser;
        break;
      
      case 'all':
      default:
        filtered = mixArticles(normalizedGoogle, normalizedUser);
        break;
    }

    console.log(`Displaying ${filtered.length} articles (filter: ${filter})`);
    setDisplayArticles(filtered);
  };

  /**
   * Mix Google News and user articles
   */
  const mixArticles = (googleArticles, userArticlesArray) => {
    const mixed = [];
    let userIndex = 0;

    googleArticles.forEach((article, index) => {
      mixed.push(article);
      
      // Every 5 articles, insert a user article if available
      if ((index + 1) % 5 === 0 && userIndex < userArticlesArray.length) {
        mixed.push(userArticlesArray[userIndex]);
        userIndex++;
      }
    });

    // Add remaining user articles at the end
    while (userIndex < userArticlesArray.length) {
      mixed.push(userArticlesArray[userIndex]);
      userIndex++;
    }

    return mixed;
  };

  /**
   * Normalize articles to ensure consistent structure
   */
  const normalizeArticles = (articleArray, type) => {
    if (!Array.isArray(articleArray)) {
      return [];
    }

    return articleArray.map((article, index) => {
      // Extract source as STRING
      let sourceName = 'Press India';
      if (article.source) {
        if (typeof article.source === 'string') {
          sourceName = article.source;
        } else if (typeof article.source === 'object') {
          sourceName = article.source.name || article.source.id || 'Press India';
        }
      }

      // Ensure unique ID
      const uniqueId = article.id || `${type}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        id: uniqueId,
        title: article.title || 'Untitled',
        description: article.description || article.content || 'Click to read more',
        urlToImage: article.urlToImage || article.thumbnail || article.image || null,
        url: article.url || article.link || '#',
        source: sourceName,
        author: article.author || sourceName,
        category: article.category || category,
        publishedAt: article.publishedAt || article.createdAt || new Date().toISOString(),
        content: article.content || article.description || '',
        type: type // 'google' or 'user'
      };
    });
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setContentFilter(filter);
    applyFilter(googleNews, userArticles, filter);
  };

  // Refresh content
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllContent();
    setRefreshing(false);
    toast.success('Content refreshed!');
  };

  // Load content on mount and when category changes
  useEffect(() => {
    loadAllContent();
  }, [category]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Content</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (displayArticles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <FaNewspaper className="text-gray-400 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Content Available</h3>
          <p className="text-gray-600 mb-4">
            {contentFilter === 'user' 
              ? 'No user articles found for this category.'
              : 'No articles found for this category. Try refreshing or select a different category.'}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Main feed
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <FaNewspaper className="text-primary text-2xl" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {category === 'all' ? 'Latest Content' : `${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </h2>
            <p className="text-sm text-gray-600">
              {displayArticles.length} articles
              {contentFilter === 'all' && userArticles.length > 0 && 
                ` (${googleNews.length} news, ${userArticles.length} user)`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Content Filter */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                contentFilter === 'all' 
                  ? 'bg-white shadow text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Show All"
            >
              <FaFilter className="inline mr-1" />
              All
            </button>
            <button
              onClick={() => handleFilterChange('news')}
              className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                contentFilter === 'news' 
                  ? 'bg-white shadow text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="News Only"
            >
              <FaGlobe className="inline mr-1" />
              News
            </button>
            <button
              onClick={() => handleFilterChange('user')}
              className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                contentFilter === 'user' 
                  ? 'bg-white shadow text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="User Articles Only"
            >
              <FaUser className="inline mr-1" />
              User
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
              title="Grid View"
            >
              <FaTh className={viewMode === 'grid' ? 'text-primary' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              title="List View"
            >
              <FaList className={viewMode === 'list' ? 'text-primary' : 'text-gray-600'} />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 flex items-center gap-2 disabled:opacity-50 transition"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Content Type Info Banner */}
      {contentFilter !== 'all' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {contentFilter === 'news' 
              ? '🌐 Showing Google News only' 
              : '👤 Showing user-generated articles only'}
            <button 
              onClick={() => handleFilterChange('all')} 
              className="ml-2 text-primary underline hover:text-blue-700"
            >
              Show all content
            </button>
          </p>
        </div>
      )}

      {/* Articles Grid/List */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
      }>
        {displayArticles.map((article) => (
          <div key={article.id} className="relative">
            {/* Article Type Badge */}
            {article.type && (
              <div className="absolute top-2 right-2 z-10">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  article.type === 'user' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {article.type === 'user' ? '👤 User' : '🌐 News'}
                </span>
              </div>
            )}
            <NewsCard
              article={article}
              viewMode={viewMode}
            />
          </div>
        ))}
      </div>

      {/* Load More */}
      {displayArticles.length >= 20 && (
        <div className="text-center mt-8">
          <button 
            onClick={() => toast.info('Load more feature coming soon!')}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Load More Articles
          </button>
        </div>
      )}
    </div>
  );
};

export default MixedFeed;