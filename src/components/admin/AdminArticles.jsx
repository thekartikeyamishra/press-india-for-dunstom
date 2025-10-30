// File: src/pages/admin/AdminArticles.jsx
// ============================================
// ADMIN ARTICLES MANAGEMENT
// Manage articles, convert grievances to articles
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import {
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaDownload,
  FaPlus,
  FaCheck,
  FaTimes,
  FaClock,
  FaFileAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      console.log('📰 Loading articles...');

      const q = query(
        collection(db, 'articles'),
        orderBy('publishedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setArticles(data);
      console.log(`✅ Loaded ${data.length} articles`);

    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (articleId, newStatus) => {
    try {
      console.log(`🔄 Updating article ${articleId} status to ${newStatus}`);

      await updateDoc(doc(db, 'articles', articleId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'published' && { publishedAt: new Date() })
      });

      setArticles(prev =>
        prev.map(a => a.id === articleId ? { ...a, status: newStatus } : a)
      );

      toast.success(`Article ${newStatus}`);
      console.log('✅ Status updated');

    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      console.log(`🗑️ Deleting article ${articleId}`);

      await deleteDoc(doc(db, 'articles', articleId));

      setArticles(prev => prev.filter(a => a.id !== articleId));

      toast.success('Article deleted successfully');
      console.log('✅ Deleted');

    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredArticles.map(a => ({
        ID: a.id,
        Title: a.title,
        Author: a.author,
        Status: a.status,
        Category: a.category,
        Views: a.views || 0,
        Published: new Date(a.publishedAt?.toDate()).toISOString()
      }));

      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      ).join('\n');
      const csv = headers + '\n' + rows;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `articles_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter and sort articles
  let filteredArticles = articles.filter(a => {
    const matchesSearch = 
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort
  filteredArticles.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.publishedAt?.toMillis() - a.publishedAt?.toMillis();
      case 'oldest':
        return a.publishedAt?.toMillis() - b.publishedAt?.toMillis();
      case 'views':
        return (b.views || 0) - (a.views || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Articles</h1>
                <p className="text-sm text-gray-600">{filteredArticles.length} total articles</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/articles/create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaPlus /> Create Article
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaDownload /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="politics">Politics</option>
              <option value="business">Business</option>
              <option value="technology">Technology</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="environment">Environment</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="views">Most Viewed</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaFileAlt className="text-xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheck className="text-xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {articles.filter(a => a.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaClock className="text-xl text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {articles.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <FaFileAlt className="text-xl text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {articles.filter(a => a.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Author</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Published</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No articles found
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{article.title}</p>
                          <p className="text-xs text-gray-500 truncate">{article.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{article.author}</td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={article.status}
                          onChange={(e) => handleStatusChange(article.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="pending">Pending</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{article.views || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(article.publishedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/articles/${article.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminArticles;