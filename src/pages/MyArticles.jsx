import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { getUserArticles, deleteArticle } from '../services/articleService';
import toast from 'react-hot-toast';
import { 
  FaNewspaper, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaPlus,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf
} from 'react-icons/fa';

const MyArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const filterStatus = filter === 'all' ? null : filter;
      const data = await getUserArticles(user.uid, filterStatus);
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await deleteArticle(articleId);
      toast.success('Article deleted successfully');
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(error.message || 'Failed to delete article');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending_review':
        return <FaHourglassHalf className="text-yellow-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FaNewspaper className="text-primary text-3xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>
                <p className="text-gray-600">Manage your published content</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/articles/new')}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              <FaPlus />
              Write New Article
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'pending_review', 'published', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaNewspaper className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No articles yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start writing your first article and share your story!
            </p>
            <button
              onClick={() => navigate('/articles/new')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Write Your First Article
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Article Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusIcon(article.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(article.status)}`}>
                          {article.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {article.summary && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {article.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaClock />
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Category: <span className="font-medium">{article.category}</span>
                      </span>
                      {article.views !== undefined && (
                        <span className="flex items-center gap-1">
                          <FaEye />
                          {article.views} views
                        </span>
                      )}
                      {article.sources && (
                        <span>
                          {article.sources.length} source{article.sources.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {article.status === 'draft' && (
                      <>
                        <button
                          onClick={() => navigate(`/articles/edit/${article.id}`)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                          <FaEdit />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          <FaTrash />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </>
                    )}

                    {article.status === 'published' && (
                      <button
                        onClick={() => navigate(`/article/${article.id}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      >
                        <FaEye />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    )}

                    {article.status === 'rejected' && (
                      <button
                        onClick={() => navigate(`/articles/edit/${article.id}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                      >
                        <FaEdit />
                        <span className="hidden sm:inline">Revise</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Rejection reason */}
                {article.status === 'rejected' && article.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {article.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyArticles;