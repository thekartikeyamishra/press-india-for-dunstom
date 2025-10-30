// src/pages/MyGrievances.jsx
// ============================================
// MY GRIEVANCES PAGE - ERROR FREE
// Fixed: Correct imports from proper locations
// User's personal grievances dashboard
// ============================================

// cSpell:ignore upvotes downvotes

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';

// ✅ CORRECT: Import configurations from grievanceConfig.js
import { 
  GRIEVANCE_STATUS,
  GRIEVANCE_TIERS,
  PAYMENT_STATUS,
  getTierById,
  getStatusById,
  formatCurrency,
  getDaysSinceSubmission
} from '../config/grievanceConfig';

// ✅ CORRECT: Import service from grievanceService.js
import grievanceService from '../services/grievanceService';

import { 
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaThumbsUp,
  FaThumbsDown,
  FaExclamationCircle,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const MyGrievances = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    loadUserGrievances();
  }, []);

  useEffect(() => {
    filterGrievances();
  }, [grievances, searchTerm, statusFilter, tierFilter]);

  const loadUserGrievances = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        toast.error('Please login to view your grievances');
        navigate('/auth?mode=login');
        return;
      }

      const userGrievances = await grievanceService.getUserGrievances(user.uid);
      setGrievances(userGrievances);
    } catch (error) {
      console.error('Error loading grievances:', error);
      toast.error('Failed to load your grievances');
    } finally {
      setLoading(false);
    }
  };

  const filterGrievances = () => {
    let filtered = [...grievances];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g => 
        g.title?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term) ||
        g.department?.toLowerCase().includes(term) ||
        g.city?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(g => g.tier === tierFilter);
    }

    setFilteredGrievances(filtered);
  };

  const handleDelete = async (grievanceId) => {
    if (!window.confirm('Are you sure you want to delete this grievance? This action cannot be undone.')) {
      return;
    }

    try {
      await grievanceService.deleteGrievance(grievanceId);
      toast.success('Grievance deleted successfully');
      await loadUserGrievances();
    } catch (error) {
      console.error('Error deleting grievance:', error);
      toast.error(error.message || 'Failed to delete grievance');
    }
  };

  const handleClose = async (grievanceId) => {
    if (!window.confirm('Are you sure you want to close this grievance? Refund will be processed if applicable.')) {
      return;
    }

    try {
      await grievanceService.closeGrievance(grievanceId, 'Closed by user');
      toast.success('Grievance closed successfully');
      await loadUserGrievances();
    } catch (error) {
      console.error('Error closing grievance:', error);
      toast.error(error.message || 'Failed to close grievance');
    }
  };

  const getStats = () => {
    return {
      total: grievances.length,
      pending: grievances.filter(g => g.status === 'pending').length,
      active: grievances.filter(g => g.status === 'active').length,
      inProgress: grievances.filter(g => g.status === 'in_progress').length,
      resolved: grievances.filter(g => g.status === 'resolved').length,
      closed: grievances.filter(g => g.status === 'closed').length
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your grievances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Grievances</h1>
              <p className="text-white/90">Track and manage your submitted grievances</p>
            </div>
            <button
              onClick={() => navigate('/grievance/create')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-gray-100 font-semibold transition"
            >
              <FaPlus /> Create New Grievance
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="bg-white border-b py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.closed}</div>
              <div className="text-sm text-gray-600">Closed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, department, city..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Statuses</option>
              {Object.values(GRIEVANCE_STATUS).map(status => (
                <option key={status.id} value={status.id}>
                  {status.icon} {status.label}
                </option>
              ))}
            </select>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Tiers</option>
              {Object.values(GRIEVANCE_TIERS).map(tier => (
                <option key={tier.id} value={tier.id}>
                  {tier.badge}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || tierFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTierFilter('all');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="mt-2 text-sm text-gray-600">
            Showing {filteredGrievances.length} of {grievances.length} grievances
          </div>
        </div>
      </div>

      {/* Grievances List */}
      <div className="container mx-auto px-4 py-8">
        {filteredGrievances.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaExclamationCircle className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Grievances Found</h2>
            <p className="text-gray-600 mb-6">
              {grievances.length === 0
                ? "You haven't created any grievances yet."
                : "No grievances match your filters."}
            </p>
            {grievances.length === 0 && (
              <button
                onClick={() => navigate('/grievance/create')}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
              >
                Create Your First Grievance
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGrievances.map((grievance) => {
              const tierConfig = getTierById(grievance.tier);
              const statusConfig = getStatusById(grievance.status);
              const daysSince = getDaysSinceSubmission(grievance.createdAt);
              const netVotes = (grievance.upvotes || 0) - (grievance.downvotes || 0);

              return (
                <div
                  key={grievance.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Tier Badge */}
                      <div>
                        <span className={`px-3 py-1 ${tierConfig?.bgColor} text-white rounded-full text-xs font-semibold`}>
                          {tierConfig?.badge}
                        </span>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {grievance.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {grievance.description}
                        </p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FaClock /> {daysSince} days ago
                          </span>
                          <span className="capitalize">
                            {grievance.department}
                          </span>
                          <span>
                            {grievance.city}, {grievance.state}
                          </span>
                          <span className="flex items-center gap-2">
                            <FaThumbsUp className="text-green-600" />
                            {grievance.upvotes || 0}
                            <FaThumbsDown className="text-red-600" />
                            {grievance.downvotes || 0}
                            <span className="font-semibold">
                              (Net: {netVotes})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span className={`px-3 py-1 bg-${statusConfig?.color}-100 text-${statusConfig?.color}-700 rounded-full text-xs font-semibold whitespace-nowrap`}>
                        {statusConfig?.icon} {statusConfig?.label}
                      </span>
                    </div>
                  </div>

                  {/* Progress Updates */}
                  {grievance.progressUpdates && grievance.progressUpdates.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Latest Update:</p>
                      <p className="text-sm text-blue-800">
                        {grievance.progressUpdates[grievance.progressUpdates.length - 1].message}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {new Date(grievance.progressUpdates[grievance.progressUpdates.length - 1].timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Payment Info */}
                  {grievance.paymentStatus && (
                    <div className="mb-4 flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Payment:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        grievance.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        grievance.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
                        grievance.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {grievance.paymentStatus?.toUpperCase()}
                      </span>
                      {grievance.paymentAmount && (
                        <span className="text-gray-600">
                          {formatCurrency(grievance.paymentAmount)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => navigate(`/grievance/${grievance.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      <FaEye /> View Details
                    </button>

                    {grievance.status === 'draft' && (
                      <button
                        onClick={() => navigate(`/grievance/edit/${grievance.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm"
                      >
                        <FaEdit /> Edit
                      </button>
                    )}

                    {['draft', 'pending'].includes(grievance.status) && (
                      <button
                        onClick={() => handleDelete(grievance.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                      >
                        <FaTrash /> Delete
                      </button>
                    )}

                    {!['closed', 'resolved', 'rejected'].includes(grievance.status) && (
                      <button
                        onClick={() => handleClose(grievance.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition text-sm"
                      >
                        <FaCheckCircle /> Close
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGrievances;