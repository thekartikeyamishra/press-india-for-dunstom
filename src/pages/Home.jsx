// E:\press-india\src\pages\Home.jsx
// ============================================
// HOME PAGE - With News & Articles Section
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import newsService from '../services/newsService';
import { 
  FaBullhorn, 
  FaNewspaper, 
  FaPenFancy, 
  FaFire, 
  FaTrophy,
  FaArrowRight,
  FaChartLine,
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaEye
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [featuredGrievances, setFeaturedGrievances] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [stats, setStats] = useState({
    totalGrievances: 0,
    activeGrievances: 0,
    resolvedGrievances: 0,
    totalUsers: 1250
  });

  useEffect(() => {
    loadData();
    loadNews();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load top grievances
      const grievances = await grievanceService.getGrievances({ 
        limit: 6,
        sortBy: 'netVotes' 
      });
      setFeaturedGrievances(grievances || []);

      // Load stats
      const statsData = await grievanceService.getStats();
      if (statsData) {
        setStats({
          totalGrievances: statsData.total || 0,
          activeGrievances: statsData.active || 0,
          resolvedGrievances: statsData.resolved || 0,
          totalUsers: statsData.users || 1250
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async () => {
    try {
      setNewsLoading(true);
      const news = await newsService.getNews('general');
      setFeaturedNews((news || []).slice(0, 6)); // Get first 6 articles
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleCreateGrievance = () => {
    if (!auth.currentUser) {
      toast.error('Please login first');
      navigate('/auth?mode=login');
      return;
    }
    navigate('/grievance/create');
  };

  const handleArticleClick = (article) => {
    if (article.url) {
      window.open(article.url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to Press India
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white opacity-90">
              India&apos;s trusted platform for verified news and citizen journalism.
              Your voice matters - Make it heard!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/make-a-noise')}
                className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg flex items-center gap-2 shadow-lg transition"
              >
                <FaBullhorn /> Make A Noise
              </button>
              <button
                onClick={() => navigate('/news')}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:bg-opacity-10 font-semibold text-lg flex items-center gap-2 transition"
              >
                <FaNewspaper /> Read News
              </button>
              {auth.currentUser && (
                <button
                  onClick={() => navigate('/my-articles')}
                  className="px-8 py-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold text-lg flex items-center gap-2 shadow-lg transition"
                >
                  <FaPenFancy /> Write Article
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm hover:shadow-md transition">
              <FaBullhorn className="text-4xl text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-800">{stats.totalGrievances}</div>
              <div className="text-gray-600 mt-1 text-sm">Total Grievances</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm hover:shadow-md transition">
              <FaFire className="text-4xl text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-800">{stats.activeGrievances}</div>
              <div className="text-gray-600 mt-1 text-sm">Active Issues</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm hover:shadow-md transition">
              <FaCheckCircle className="text-4xl text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-800">{stats.resolvedGrievances}</div>
              <div className="text-gray-600 mt-1 text-sm">Resolved</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm hover:shadow-md transition">
              <FaUsers className="text-4xl text-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-800">{stats.totalUsers}</div>
              <div className="text-gray-600 mt-1 text-sm">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News & Articles Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <FaNewspaper className="text-blue-600" /> Latest News & Articles
              </h2>
              <p className="text-gray-600">
                Stay updated with the latest verified news from India
              </p>
            </div>
            <button
              onClick={() => navigate('/news')}
              className="hidden md:flex px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold items-center gap-2 transition"
            >
              View All News <FaArrowRight />
            </button>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : featuredNews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredNews.map((article, index) => (
                  <div
                    key={index}
                    onClick={() => handleArticleClick(article)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Image */}
                    {article.urlToImage && (
                      <div className="h-48 overflow-hidden bg-gray-200">
                        <img
                          src={article.urlToImage}
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Source Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {article.source?.name || 'News'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FaClock />
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 hover:text-blue-600 transition">
                        {article.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                        {article.description || 'Click to read more...'}
                      </p>

                      {/* Read More */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-blue-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                          Read Full Article <FaArrowRight />
                        </span>
                        {article.author && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaPenFancy className="text-xs" />
                            {article.author.split(',')[0].substring(0, 20)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8 flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => navigate('/news')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2 transition"
                >
                  <FaNewspaper /> View All News
                </button>
                {auth.currentUser && (
                  <button
                    onClick={() => navigate('/my-articles')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold inline-flex items-center gap-2 transition"
                  >
                    <FaPenFancy /> Write Your Article
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <FaNewspaper className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No news articles available
              </h3>
              <p className="text-gray-500 mb-6">
                Check back later for the latest updates
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Grievances */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <FaFire className="text-red-500" /> Trending Grievances
              </h2>
              <p className="text-gray-600">
                Most voted issues that need attention
              </p>
            </div>
            <button
              onClick={() => navigate('/make-a-noise')}
              className="hidden md:flex px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold items-center gap-2 transition"
            >
              View All <FaArrowRight />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : featuredGrievances.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredGrievances.map((grievance) => (
                  <div
                    key={grievance.id}
                    onClick={() => navigate(`/grievance/${grievance.id}`)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden transform hover:-translate-y-1"
                  >
                    <div className={`px-4 py-2 text-white font-semibold text-sm ${
                      grievance.tier === 'top' ? 'bg-red-600' :
                      grievance.tier === 'medium' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {grievance.tier === 'top' ? '🔥 TOP' :
                       grievance.tier === 'medium' ? '⭐ MEDIUM' :
                       '📢 MICRO'} TIER
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 hover:text-blue-600 transition">
                        {grievance.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                        {grievance.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <span>📍</span>
                        <span>{grievance.city}, {grievance.state}</span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 font-semibold">👍 {grievance.upvotes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-red-600 font-semibold">👎 {grievance.downvotes || 0}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Net: <span className="font-bold text-blue-600">{grievance.netVotes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <button
                  onClick={() => navigate('/make-a-noise')}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold inline-flex items-center gap-2 transition"
                >
                  View All Grievances <FaArrowRight />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No grievances yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to raise your voice!
              </p>
              <button
                onClick={handleCreateGrievance}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold inline-flex items-center gap-2"
              >
                <FaBullhorn /> Create First Grievance
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            How Press India Works
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Your journey from raising a concern to making a real impact
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
                <FaBullhorn className="text-3xl text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Raise Your Voice
              </h3>
              <p className="text-gray-600">
                Create a grievance about issues affecting your community. 
                Choose tier based on impact and reach.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
                <FaChartLine className="text-3xl text-green-600" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">2</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Community Votes
              </h3>
              <p className="text-gray-600">
                Community members vote on grievances. 
                High-voted issues gain more visibility and priority.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition">
                <FaTrophy className="text-3xl text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">3</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Featured Article
              </h3>
              <p className="text-gray-600">
                Top-voted grievances become featured news articles, 
                reaching millions of readers across India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of citizens raising their voice for a better India.
            Your grievance could be the next featured story!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                if (!auth.currentUser) {
                  navigate('/auth?mode=signup');
                } else {
                  navigate('/grievance/create');
                }
              }}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg transition shadow-lg"
            >
              {auth.currentUser ? 'Create Grievance' : 'Get Started Free'}
            </button>
            <button
              onClick={() => navigate('/make-a-noise')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:bg-opacity-10 font-semibold text-lg transition"
            >
              Browse Grievances
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;