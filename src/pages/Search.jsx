import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import NewsCard from '../components/news/NewsCard';
import { searchArticles } from '../services/articleService';
import { getGoogleNews } from '../services/newsService';
import { FaSpinner } from 'react-icons/fa';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    type: searchParams.get('type') || 'all',
    sortBy: searchParams.get('sortBy') || 'recent'
  });

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      performSearch(query, filters);
    }
  }, [searchParams]);

  const performSearch = async (query, currentFilters) => {
    setLoading(true);
    try {
      let allResults = [];

      // Search user articles
      if (currentFilters.type === 'all' || currentFilters.type === 'user') {
        const userArticles = await searchArticles(query);
        allResults = [...allResults, ...userArticles.map(a => ({ ...a, type: 'user' }))];
      }

      // Search Google News
      if (currentFilters.type === 'all' || currentFilters.type === 'news') {
        const newsArticles = await getGoogleNews(currentFilters.category === 'all' ? 'general' : currentFilters.category);
        const filtered = newsArticles.filter(article =>
          article.title?.toLowerCase().includes(query.toLowerCase()) ||
          article.description?.toLowerCase().includes(query.toLowerCase())
        );
        allResults = [...allResults, ...filtered.map(a => ({ ...a, type: 'google' }))];
      }

      // Apply category filter
      if (currentFilters.category !== 'all') {
        allResults = allResults.filter(a => a.category === currentFilters.category);
      }

      // Apply sorting
      if (currentFilters.sortBy === 'popular') {
        allResults.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (currentFilters.sortBy === 'trending') {
        allResults.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else {
        allResults.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query, newFilters) => {
    if (query.trim()) {
      setSearchParams({ q: query, ...newFilters });
      performSearch(query, newFilters);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const query = searchParams.get('q');
    if (query) {
      setSearchParams({ q: query, ...newFilters });
      performSearch(query, newFilters);
    }
  };

  const query = searchParams.get('q');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} />
        </div>

        {/* Results */}
        {query && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results for "{query}"
              </h2>
              <p className="text-gray-600 mt-1">
                {loading ? 'Searching...' : `${results.length} results found`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-primary" />
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((article, index) => (
                  <NewsCard key={`${article.id || index}`} article={article} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No results found. Try different keywords.</p>
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Search for Articles & News</h2>
            <p className="text-gray-600">Enter keywords to find articles, news, and topics</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
