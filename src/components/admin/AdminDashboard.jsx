// File: src/pages/admin/AdminDashboard.jsx
// ============================================
// ADMIN DASHBOARD - Complete Production Ready
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import {
  FaUsers,
  FaFileAlt,
  FaExclamationTriangle,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaMoneyBillWave,
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaDownload
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGrievances: 0,
    totalArticles: 0,
    pendingGrievances: 0,
    resolvedGrievances: 0,
    totalRevenue: 0,
    todayGrievances: 0,
    activeUsers: 0
  });
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        toast.error('Please login to access admin panel');
        navigate('/auth?mode=login&redirect=/admin');
        return;
      }

      // Check if user is admin
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('uid', '==', user.uid))
      );

      if (userDoc.empty) {
        toast.error('User not found');
        navigate('/');
        return;
      }

      const userData = userDoc.docs[0].data();
      
      if (userData.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      console.log('✅ Admin access granted');
      
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');

      // Get stats in parallel
      const [
        usersCount,
        grievancesCount,
        articlesCount,
        pendingCount,
        resolvedCount
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'grievances')),
        getCountFromServer(collection(db, 'articles')),
        getCountFromServer(
          query(collection(db, 'grievances'), where('status', '==', 'pending'))
        ),
        getCountFromServer(
          query(collection(db, 'grievances'), where('status', '==', 'resolved'))
        )
      ]);

      // Get today's grievances
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayGrievances = await getDocs(
        query(
          collection(db, 'grievances'),
          where('createdAt', '>=', today)
        )
      );

      // Get recent grievances
      const grievancesSnapshot = await getDocs(
        query(
          collection(db, 'grievances'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
      );

      const grievancesData = grievancesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get recent articles
      const articlesSnapshot = await getDocs(
        query(
          collection(db, 'articles'),
          orderBy('publishedAt', 'desc'),
          limit(5)
        )
      );

      const articlesData = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate total revenue
      let totalRevenue = 0;
      grievancesData.forEach(g => {
        if (g.paymentAmount && g.paymentStatus === 'completed') {
          totalRevenue += g.paymentAmount;
        }
      });

      setStats({
        totalUsers: usersCount.data().count,
        totalGrievances: grievancesCount.data().count,
        totalArticles: articlesCount.data().count,
        pendingGrievances: pendingCount.data().count,
        resolvedGrievances: resolvedCount.data().count,
        totalRevenue,
        todayGrievances: todayGrievances.size,
        activeUsers: usersCount.data().count // Simplified for now
      });

      setRecentGrievances(grievancesData);
      setRecentArticles(articlesData);

      console.log('✅ Dashboard data loaded');

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock },
      'in-review': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaEye },
      'in-progress': { bg: 'bg-purple-100', text: 'text-purple-800', icon: FaChartLine },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FaTimes }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="text-xs" />
        {status}
      </span>
    );
  };

  const getTierBadge = (tier) => {
    const tierConfig = {
      micro: { bg: 'bg-green-500', text: 'Micro' },
      mini: { bg: 'bg-blue-500', text: 'Mini' },
      medium: { bg: 'bg-purple-500', text: 'Medium' },
      mega: { bg: 'bg-orange-500', text: 'Mega' },
      giga: { bg: 'bg-red-500', text: 'Giga' }
    };

    const config = tierConfig[tier?.toLowerCase()] || tierConfig.micro;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white ${config.bg}`}>
        {config.text}
      </span>
    );
  };

  const handleViewGrievance = (id) => {
    navigate(`/make-a-noise/${id}`);
  };

  const handleEditGrievance = (id) => {
    navigate(`/admin/grievances/edit/${id}`);
  };

  const handleViewArticle = (id) => {
    navigate(`/articles/${id}`);
  };

  const exportToCSV = () => {
    try {
      const csvData = recentGrievances.map(g => ({
        ID: g.id,
        Title: g.title,
        Status: g.status,
        Tier: g.tier,
        Amount: g.paymentAmount || 0,
        Created: formatDate(g.createdAt),
        User: g.userName
      }));

      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
      const csv = headers + '\n' + rows;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grievances_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredGrievances = recentGrievances.filter(g => {
    const matchesSearch = g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || g.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage grievances, articles, and users</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaDownload /> Export CSV
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Grievances */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaExclamationTriangle className="text-2xl text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalGrievances}</h3>
            <p className="text-sm text-gray-600">Grievances</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-green-600">+{stats.todayGrievances}</span>
              <span className="text-gray-500">today</span>
            </div>
          </div>

          {/* Pending Grievances */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaClock className="text-2xl text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingGrievances}</h3>
            <p className="text-sm text-gray-600">Need Review</p>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.pendingGrievances / stats.totalGrievances) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaMoneyBillWave className="text-2xl text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Revenue</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(stats.totalRevenue)}
            </h3>
            <p className="text-sm text-gray-600">Total Collected</p>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaUsers className="text-2xl text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Users</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h3>
            <p className="text-sm text-gray-600">Registered</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedGrievances}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaFileAlt className="text-xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaChartLine className="text-xl text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalGrievances > 0 
                    ? Math.round((stats.resolvedGrievances / stats.totalGrievances) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Grievances */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Recent Grievances</h2>
                  <button
                    onClick={() => navigate('/admin/grievances')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All →
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search grievances..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-review">In Review</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="divide-y">
                {filteredGrievances.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No grievances found
                  </div>
                ) : (
                  filteredGrievances.map((grievance) => (
                    <div key={grievance.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTierBadge(grievance.tier)}
                            {getStatusBadge(grievance.status)}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {grievance.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {grievance.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{grievance.userName || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{formatDate(grievance.createdAt)}</span>
                            <span>•</span>
                            <span>{formatCurrency(grievance.paymentAmount || 0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewGrievance(grievance.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEditGrievance(grievance.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Articles */}
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Articles</h2>
                  <button
                    onClick={() => navigate('/admin/articles')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
              </div>

              <div className="divide-y">
                {recentArticles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No articles yet
                  </div>
                ) : (
                  recentArticles.map((article) => (
                    <div 
                      key={article.id} 
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewArticle(article.id)}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>{article.author}</span>
                        <span>•</span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600">
                          {article.views || 0} views
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          article.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {article.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/admin/grievances')}
                  className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-900 font-medium"
                >
                  Manage Grievances
                </button>
                <button
                  onClick={() => navigate('/admin/articles')}
                  className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-900 font-medium"
                >
                  Manage Articles
                </button>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-purple-900 font-medium"
                >
                  Manage Users
                </button>
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-900 font-medium"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;