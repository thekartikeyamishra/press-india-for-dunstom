// File: src/pages/AdminPanel.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FaCheckCircle, FaTimesCircle, FaEye, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState('pending_review');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadArticles();
    }
  }, [isAdmin, filter]);

  const checkAdminAccess = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await (await import('firebase/firestore')).getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error('User profile not found');
        navigate('/');
        return;
      }

      const userData = userSnap.data();
      
      if (userData.role !== 'admin' && userData.role !== 'editor') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, where('status', '==', filter));
      
      const querySnapshot = await getDocs(q);
      const loadedArticles = [];
      
      querySnapshot.forEach((doc) => {
        loadedArticles.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by submission date
      loadedArticles.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || new Date(0);
        const dateB = b.submittedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setArticles(loadedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const approveArticle = async (articleId) => {
    try {
      const articleRef = doc(db, 'articles', articleId);
      
      await updateDoc(articleRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });

      toast.success('Article approved and published!');
      loadArticles();
    } catch (error) {
      console.error('Error approving article:', error);
      toast.error('Failed to approve article');
    }
  };

  const rejectArticle = async (articleId, reason = '') => {
    try {
      const articleRef = doc(db, 'articles', articleId);
      
      await updateDoc(articleRef, {
        status: 'rejected',
        rejectionReason: reason || 'Does not meet publication standards',
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });

      toast.success('Article rejected');
      loadArticles();
    } catch (error) {
      console.error('Error rejecting article:', error);
      toast.error('Failed to reject article');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Panel - Article Review
          </h1>
          <p className="text-gray-600">
            Review and manage submitted articles
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('pending_review')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending_review'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaClock className="inline mr-2" />
              Pending Review ({articles.filter(a => a.status === 'pending_review').length})
            </button>
            
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'published'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCheckCircle className="inline mr-2" />
              Published
            </button>
            
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaTimesCircle className="inline mr-2" />
              Rejected
            </button>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500">No articles found</p>
            </div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {article.summary || article.content?.substring(0, 200)}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Author: {article.authorName}</span>
                      <span>•</span>
                      <span>Category: {article.category}</span>
                      <span>•</span>
                      <span>
                        Submitted: {article.submittedAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                      </span>
                    </div>
                    
                    {article.sources && (
                      <div className="mt-3 text-sm text-gray-600">
                        <strong>Sources:</strong> {article.sources.length} source(s)
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => window.open(`/articles/preview/${article.id}`, '_blank')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <FaEye />
                      Preview
                    </button>
                    
                    {filter === 'pending_review' && (
                      <>
                        <button
                          onClick={() => approveArticle(article.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                        >
                          <FaCheckCircle />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => rejectArticle(article.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                        >
                          <FaTimesCircle />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;