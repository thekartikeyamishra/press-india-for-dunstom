/*
import React from 'react';
import NewsFeed from '../components/news/NewsFeed';
import SecretDeveloper from '../components/common/SecretDeveloper';

const Dashboard = () => {
  return (
    <>
      <SecretDeveloper />
      <NewsFeed />
    </>
  );
};

export default Dashboard;
*/

// File: src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getUserArticles } from '../services/articleService';
import { FaNewspaper, FaPenNib, FaChartLine, FaCheckCircle, FaClock, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    pending: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        navigate('/auth');
        return;
      }

      // Load profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setProfile(userSnap.data());
      }

      // Load articles
      const userArticles = await getUserArticles(user.uid);
      setArticles(userArticles.slice(0, 5)); // Latest 5 articles

      // Calculate stats
      const articleStats = {
        total: userArticles.length,
        published: userArticles.filter(a => a.status === 'published').length,
        draft: userArticles.filter(a => a.status === 'draft').length,
        pending: userArticles.filter(a => a.status === 'pending_review').length
      };
      setStats(articleStats);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.fullName || profile?.displayName || 'Writer'}!
          </h1>
          <p className="text-lg opacity-90">
            Ready to share your next story?
          </p>
          <button
            onClick={() => navigate('/articles/new')}
            className="mt-4 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
          >
            <FaPenNib />
            Write New Article
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <FaNewspaper className="text-gray-400 text-2xl" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-gray-600 text-sm">Total Articles</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <FaCheckCircle className="text-green-500 text-2xl" />
              <span className="text-3xl font-bold text-green-900">{stats.published}</span>
            </div>
            <p className="text-gray-600 text-sm">Published</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <FaClock className="text-yellow-500 text-2xl" />
              <span className="text-3xl font-bold text-yellow-900">{stats.pending}</span>
            </div>
            <p className="text-gray-600 text-sm">Pending Review</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <FaEdit className="text-gray-400 text-2xl" />
              <span className="text-3xl font-bold text-gray-900">{stats.draft}</span>
            </div>
            <p className="text-gray-600 text-sm">Drafts</p>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Articles</h2>
            <button
              onClick={() => navigate('/articles/my')}
              className="text-primary hover:underline text-sm font-medium"
            >
              View All →
            </button>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <FaNewspaper className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No articles yet</p>
              <button
                onClick={() => navigate('/articles/new')}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
              >
                Write Your First Article
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary transition cursor-pointer"
                  onClick={() => navigate(`/articles/edit/${article.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {article.createdAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' :
                      article.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                      article.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {article.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <FaEdit className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Status */}
        {profile && !profile.verified && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
            <div className="flex items-start gap-4">
              <FaCheckCircle className="text-blue-600 text-3xl mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-2">
                  Complete Your Verification
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Get verified to unlock all features and start publishing articles immediately.
                </p>
                <button
                  onClick={() => navigate('/profile/verification')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Start Verification Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;