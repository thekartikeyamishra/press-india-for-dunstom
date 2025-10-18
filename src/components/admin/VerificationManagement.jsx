// File: src/components/admin/VerificationManagement.jsx

import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaCheckCircle, FaTimesCircle, FaEye, FaClock, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';

const VerificationManagement = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('pending'); // 'pending', 'all', 'verified', 'rejected'

  // Fetch verification requests
  useEffect(() => {
    fetchVerificationRequests();
  }, [filter]);

  const fetchVerificationRequests = async () => {
    setLoading(true);
    try {
      let q;
      if (filter === 'all') {
        q = query(collection(db, 'users'));
      } else {
        q = query(
          collection(db, 'users'),
          where('verificationStatus', '==', filter)
        );
      }

      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.verificationDocument) {
          requests.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort by submission date (newest first)
      requests.sort((a, b) => {
        const dateA = new Date(a.verificationSubmittedAt || 0);
        const dateB = new Date(b.verificationSubmittedAt || 0);
        return dateB - dateA;
      });

      setVerificationRequests(requests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  // Approve verification
  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        verificationStatus: 'verified',
        verifiedAt: new Date().toISOString()
      });

      toast.success('User verification approved!');
      fetchVerificationRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    }
  };

  // Reject verification
  const handleReject = async (userId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        verificationStatus: 'rejected',
        rejectionReason: rejectionReason,
        rejectedAt: new Date().toISOString()
      });

      toast.success('User verification rejected');
      fetchVerificationRequests();
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    }
  };

  // View document
  const viewDocument = (url) => {
    window.open(url, '_blank');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: FaClock, text: 'Pending' },
      verified: { color: 'bg-green-100 text-green-700', icon: FaCheckCircle, text: 'Verified' },
      rejected: { color: 'bg-red-100 text-red-700', icon: FaTimesCircle, text: 'Rejected' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badge.color}`}>
        <Icon /> {badge.text}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Verification Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          {['pending', 'verified', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      ) : verificationRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaClock className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No verification requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {verificationRequests.map((request) => (
            <Motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {request.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{request.name}</h3>
                  <p className="text-sm text-gray-600">{request.email}</p>
                </div>
              </div>

              {/* Status and Method */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(request.verificationStatus)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Method:</span>
                  <span className="text-sm font-semibold capitalize">
                    {request.verificationMethod?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <span className="text-sm font-semibold">
                    {new Date(request.verificationSubmittedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => viewDocument(request.verificationDocument)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <FaEye /> View
                </button>
                {request.verificationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 flex items-center justify-center gap-2"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </>
                )}
              </div>
            </Motion.div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Verification</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting <strong>{selectedRequest.name}</strong>'s verification:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary mb-4"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest.id)}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600"
              >
                Confirm Reject
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </div>
  );
};

export default VerificationManagement;