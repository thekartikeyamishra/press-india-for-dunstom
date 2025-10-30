// E:\press-india\src\pages\AdminDashboard.jsx
// ============================================
// ADMIN DASHBOARD - Articles + Grievances Management
// Fixed: All errors resolved
// ============================================

/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getPendingArticles, approveArticle, rejectArticle } from '../services/articleService';
import grievanceService from '../services/grievanceService';
import { FaCheck, FaTimes, FaEye, FaEdit, FaBullhorn, FaNewspaper } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('articles'); // 'articles' or 'grievances'
  
  // Articles state
  const [articles, setArticles] = useState([]);
  
  // Grievances state
  const [grievances, setGrievances] = useState([]);
  const [grievanceFilter, setGrievanceFilter] = useState('all');
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    stage: 1,
    note: ''
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === 'grievances') {
      loadGrievances();
    }
  }, [isAdmin, activeTab, grievanceFilter]);

  const checkAdminStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
        loadPendingArticles();
        loadGrievances();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingArticles = async () => {
    try {
      const pending = await getPendingArticles();
      setArticles(pending);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadGrievances = async () => {
    try {
      const filters = {
        includePrivate: true // Admin sees all
      };

      if (grievanceFilter !== 'all') {
        filters.status = grievanceFilter;
      }

      const data = await grievanceService.getGrievances(filters);
      setGrievances(data);
    } catch (error) {
      console.error('Error loading grievances:', error);
      toast.error('Failed to load grievances');
    }
  };

  const handleApproveArticle = async (articleId) => {
    try {
      await approveArticle(articleId);
      toast.success('Article approved!');
      loadPendingArticles();
    } catch (error) {
      toast.error('Failed to approve article');
    }
  };

  const handleRejectArticle = async (articleId) => {
    try {
      await rejectArticle(articleId, 'Does not meet guidelines');
      toast.success('Article rejected');
      loadPendingArticles();
    } catch (error) {
      toast.error('Failed to reject article');
    }
  };

  const openUpdateModal = (grievance) => {
    setSelectedGrievance(grievance);
    setUpdateData({
      status: grievance.status,
      stage: grievance.currentStage || 1,
      note: ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateGrievance = async () => {
    if (!selectedGrievance) return;

    try {
      // Update status
      if (updateData.status !== selectedGrievance.status) {
        await grievanceService.updateStatus(
          selectedGrievance.id,
          updateData.status,
          updateData.note
        );
      }

      // Update progress stage
      if (updateData.stage !== selectedGrievance.currentStage) {
        await grievanceService.updateProgressStage(
          selectedGrievance.id,
          updateData.stage,
          true,
          updateData.note
        );
      }

      toast.success('Grievance updated successfully!');
      setShowUpdateModal(false);
      setSelectedGrievance(null);
      loadGrievances();
    } catch (error) {
      console.error('Error updating grievance:', error);
      toast.error('Failed to update grievance');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: '📝' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      active: { color: 'bg-green-100 text-green-800', icon: '🔥' },
      reviewing: { color: 'bg-blue-100 text-blue-800', icon: '👀' },
      resolved: { color: 'bg-purple-100 text-purple-800', icon: '✅' },
      rejected: { color: 'bg-red-100 text-red-800', icon: '❌' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: '🔒' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.icon} {status.toUpperCase()}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: '🔄' },
      completed: { color: 'bg-green-100 text-green-800', icon: '✅' },
      failed: { color: 'bg-red-100 text-red-800', icon: '❌' },
      refunded: { color: 'bg-purple-100 text-purple-800', icon: '💰' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.icon} {status}
      </span>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have admin permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('articles')}
              className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'articles' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <FaNewspaper />
              Articles ({articles.length})
            </button>
            <button
              onClick={() => setActiveTab('grievances')}
              className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2
                ${activeTab === 'grievances' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <FaBullhorn />
              Grievances ({grievances.length})
            </button>
          </nav>
        </div>

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Articles ({articles.length})</h2>
            
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                  <p className="text-gray-600 mb-2">{article.summary || article.description}</p>
                  <p className="text-sm text-gray-500 mb-4">By: {article.authorName}</p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveArticle(article.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectArticle(article.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                </div>
              ))}
              
              {articles.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-gray-600">No pending articles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grievances Tab */}
        {activeTab === 'grievances' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-gray-900">{grievances.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-yellow-600">
                  {grievances.filter(g => g.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pending</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-green-600">
                  {grievances.filter(g => g.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-purple-600">
                  {grievances.filter(g => g.status === 'resolved').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Resolved</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'active', 'reviewing', 'resolved', 'rejected'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setGrievanceFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      grievanceFilter === filter
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grievances Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Grievance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {grievances.map((grievance) => (
                      <tr key={grievance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{grievance.title}</div>
                          <div className="text-sm text-gray-500">{grievance.city}, {grievance.state}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{grievance.userName}</div>
                          <div className="text-sm text-gray-500">{grievance.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(grievance.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentBadge(grievance.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 uppercase">
                            {grievance.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(grievance.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openUpdateModal(grievance)}
                            className="text-primary hover:text-opacity-80 mr-4"
                          >
                            <FaEdit className="inline mr-1" /> Update
                          </button>
                          <a
                            href={`/make-a-noise/${grievance.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <FaEye className="inline mr-1" /> View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {grievances.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No grievances found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedGrievance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Update Grievance</h2>

            <div className="space-y-6">
              {/* Grievance Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{selectedGrievance.title}</h3>
                <p className="text-sm text-gray-600">{selectedGrievance.city}, {selectedGrievance.state}</p>
                <p className="text-sm text-gray-600 mt-1">User: {selectedGrievance.userName}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Review</option>
                  <option value="active">Active</option>
                  <option value="reviewing">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Progress Stage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Stage
                </label>
                <select
                  value={updateData.stage}
                  onChange={(e) => setUpdateData({ ...updateData, stage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="1">Stage 1: Submitted</option>
                  <option value="2">Stage 2: Under Review</option>
                  <option value="3">Stage 3: In Progress</option>
                  <option value="4">Stage 4: Resolved</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Note (Optional)
                </label>
                <textarea
                  value={updateData.note}
                  onChange={(e) => setUpdateData({ ...updateData, note: e.target.value })}
                  placeholder="Add a note about this update (visible to user)..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedGrievance(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGrievance}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90"
                >
                  Update Grievance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
