// File: src/pages/admin/AdminGrievances.jsx
// ============================================
// ADMIN GRIEVANCES MANAGEMENT
// Complete CRUD operations for grievances
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
  orderBy,
  writeBatch
} from 'firebase/firestore';
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaClock,
  FaChartLine,
  FaDownload,
  FaArrowLeft
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminGrievances = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedGrievances, setSelectedGrievances] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadGrievances();
  }, []);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading grievances...');

      const q = query(
        collection(db, 'grievances'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setGrievances(data);
      console.log(`✅ Loaded ${data.length} grievances`);

    } catch (error) {
      console.error('Error loading grievances:', error);
      toast.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (grievanceId, newStatus) => {
    try {
      console.log(`🔄 Updating status for ${grievanceId} to ${newStatus}`);

      await updateDoc(doc(db, 'grievances', grievanceId), {
        status: newStatus,
        updatedAt: new Date()
      });

      // Update local state
      setGrievances(prev =>
        prev.map(g => g.id === grievanceId ? { ...g, status: newStatus } : g)
      );

      toast.success(`Status updated to ${newStatus}`);
      console.log('✅ Status updated');

    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (grievanceId) => {
    if (!window.confirm('Are you sure you want to delete this grievance? This action cannot be undone.')) {
      return;
    }

    try {
      console.log(`🗑️ Deleting grievance ${grievanceId}`);

      await deleteDoc(doc(db, 'grievances', grievanceId));

      // Update local state
      setGrievances(prev => prev.filter(g => g.id !== grievanceId));

      toast.success('Grievance deleted successfully');
      console.log('✅ Deleted');

    } catch (error) {
      console.error('Error deleting grievance:', error);
      toast.error('Failed to delete grievance');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedGrievances.length === 0) {
      toast.error('No grievances selected');
      return;
    }

    try {
      console.log(`🔄 Bulk updating ${selectedGrievances.length} grievances to ${newStatus}`);

      const batch = writeBatch(db);

      selectedGrievances.forEach(id => {
        const ref = doc(db, 'grievances', id);
        batch.update(ref, {
          status: newStatus,
          updatedAt: new Date()
        });
      });

      await batch.commit();

      // Update local state
      setGrievances(prev =>
        prev.map(g =>
          selectedGrievances.includes(g.id)
            ? { ...g, status: newStatus }
            : g
        )
      );

      toast.success(`Updated ${selectedGrievances.length} grievances`);
      setSelectedGrievances([]);
      setShowBulkActions(false);
      console.log('✅ Bulk update complete');

    } catch (error) {
      console.error('Error bulk updating:', error);
      toast.error('Failed to update grievances');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGrievances.length === 0) {
      toast.error('No grievances selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedGrievances.length} grievances? This cannot be undone.`)) {
      return;
    }

    try {
      console.log(`🗑️ Bulk deleting ${selectedGrievances.length} grievances`);

      const batch = writeBatch(db);

      selectedGrievances.forEach(id => {
        const ref = doc(db, 'grievances', id);
        batch.delete(ref);
      });

      await batch.commit();

      // Update local state
      setGrievances(prev =>
        prev.filter(g => !selectedGrievances.includes(g.id))
      );

      toast.success(`Deleted ${selectedGrievances.length} grievances`);
      setSelectedGrievances([]);
      setShowBulkActions(false);
      console.log('✅ Bulk delete complete');

    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete grievances');
    }
  };

  const toggleSelectGrievance = (id) => {
    setSelectedGrievances(prev =>
      prev.includes(id)
        ? prev.filter(gId => gId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGrievances.length === filteredGrievances.length) {
      setSelectedGrievances([]);
    } else {
      setSelectedGrievances(filteredGrievances.map(g => g.id));
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredGrievances.map(g => ({
        ID: g.id,
        Title: g.title,
        Description: g.description?.replace(/,/g, ';'),
        Status: g.status,
        Tier: g.tier,
        Amount: g.paymentAmount || 0,
        PaymentStatus: g.paymentStatus,
        User: g.userName,
        Email: g.userEmail,
        Location: `${g.city}, ${g.state}`,
        Department: g.department,
        Created: new Date(g.createdAt?.toDate()).toISOString(),
        Upvotes: g.upvotes || 0,
        Downvotes: g.downvotes || 0
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
      a.download = `grievances_${new Date().toISOString().split('T')[0]}.csv`;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter and sort grievances
  let filteredGrievances = grievances.filter(g => {
    const matchesSearch = 
      g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || g.status === filterStatus;
    const matchesTier = filterTier === 'all' || g.tier === filterTier;

    return matchesSearch && matchesStatus && matchesTier;
  });

  // Sort
  filteredGrievances.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      case 'oldest':
        return a.createdAt?.toMillis() - b.createdAt?.toMillis();
      case 'amount-high':
        return (b.paymentAmount || 0) - (a.paymentAmount || 0);
      case 'amount-low':
        return (a.paymentAmount || 0) - (b.paymentAmount || 0);
      case 'votes':
        return (b.netVotes || 0) - (a.netVotes || 0);
      default:
        return 0;
    }
  });

  const getTierBadge = (tier) => {
    const config = {
      micro: { bg: 'bg-green-500', label: 'Micro' },
      mini: { bg: 'bg-blue-500', label: 'Mini' },
      medium: { bg: 'bg-purple-500', label: 'Medium' },
      mega: { bg: 'bg-orange-500', label: 'Mega' },
      giga: { bg: 'bg-red-500', label: 'Giga' }
    };

    const c = config[tier?.toLowerCase()] || config.micro;
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading grievances...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Manage Grievances</h1>
                <p className="text-sm text-gray-600">{filteredGrievances.length} total grievances</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, ID, or user..."
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
              <option value="pending">Pending</option>
              <option value="in-review">In Review</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Tier Filter */}
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="micro">Micro</option>
              <option value="mini">Mini</option>
              <option value="medium">Medium</option>
              <option value="mega">Mega</option>
              <option value="giga">Giga</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
                <option value="votes">Most Voted</option>
              </select>
            </div>

            {selectedGrievances.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedGrievances.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Bulk Actions
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Dropdown */}
          {showBulkActions && selectedGrievances.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Bulk Actions:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkStatusChange('in-review')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Mark as In Review
                </button>
                <button
                  onClick={() => handleBulkStatusChange('in-progress')}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Mark as In Progress
                </button>
                <button
                  onClick={() => handleBulkStatusChange('resolved')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedGrievances([]);
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grievances Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedGrievances.length === filteredGrievances.length && filteredGrievances.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tier</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Votes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredGrievances.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      No grievances found
                    </td>
                  </tr>
                ) : (
                  filteredGrievances.map((grievance) => (
                    <tr key={grievance.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedGrievances.includes(grievance.id)}
                          onChange={() => toggleSelectGrievance(grievance.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{grievance.title}</p>
                          <p className="text-xs text-gray-500 truncate">{grievance.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{grievance.userName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{grievance.city}, {grievance.state}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={grievance.status}
                          onChange={(e) => handleStatusChange(grievance.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-review">In Review</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {getTierBadge(grievance.tier)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(grievance.paymentAmount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">{grievance.paymentStatus}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-green-600">↑{grievance.upvotes || 0}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-red-600">↓{grievance.downvotes || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(grievance.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/make-a-noise/${grievance.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/grievances/edit/${grievance.id}`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(grievance.id)}
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

export default AdminGrievances;