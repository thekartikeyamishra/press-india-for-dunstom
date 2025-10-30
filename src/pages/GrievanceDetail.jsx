// src/pages/GrievanceDetail.jsx
// ============================================
// GRIEVANCE DETAIL PAGE - FIXED VERSION
// All errors resolved, production ready
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import { 
  GRIEVANCE_TIERS, 
  GRIEVANCE_STATUS,
  DEPARTMENT_CATEGORIES,
  PROGRESS_STAGES,
  formatCurrency,
  canUserEdit,
  canUserClose,
  canUserDelete
} from '../config/grievanceConfig';
import { 
  FaThumbsUp, 
  FaThumbsDown, 
  FaMapMarkerAlt, 
  FaBuilding, 
  FaHashtag,
  FaClock,
  FaUser,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheckCircle,
  FaEye,
  FaShare,
  FaChartLine,
  FaExclamationCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const GrievanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grievance, setGrievance] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);
  const [voting, setVoting] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    loadGrievance();
    loadProgress();
    loadUserVote();
  }, [id]);

  const loadGrievance = async () => {
    try {
      setLoading(true);
      const data = await grievanceService.getGrievance(id);
      if (data) {
        setGrievance(data);
      } else {
        toast.error('Grievance not found');
        navigate('/make-a-noise');
      }
    } catch (error) {
      console.error('Error loading grievance:', error);
      toast.error('Failed to load grievance');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const data = await grievanceService.getProgress(id);
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadUserVote = async () => {
    if (auth.currentUser) {
      try {
        const vote = await grievanceService.getUserVote(id);
        setUserVote(vote);
      } catch (error) {
        console.error('Error loading user vote:', error);
      }
    }
  };

  // ✅ FIXED: Using correct method name 'vote' instead of 'voteGrievance'
  const handleVote = async (voteType) => {
    if (!auth.currentUser) {
      toast.error('Please login to vote');
      navigate('/auth?mode=login');
      return;
    }

    if (voting) return;

    try {
      setVoting(true);
      
      // ✅ FIXED: Using grievanceService.vote() which exists
      const result = await grievanceService.vote(id, voteType);
      
      // Update local state based on result
      if (result.voted) {
        setUserVote(voteType);
        toast.success(voteType === 'upvote' ? '👍 Upvoted!' : '👎 Downvoted!');
      } else {
        setUserVote(null);
        toast.success('Vote removed');
      }

      // Reload grievance to get updated counts
      await loadGrievance();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/make-a-noise/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this grievance? This cannot be undone.')) {
      return;
    }

    try {
      await grievanceService.deleteGrievance(id);
      toast.success('Grievance deleted');
      navigate('/make-a-noise');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  // ✅ FIXED: Using correct method 'updateStatus' instead of 'closeGrievance'
  const handleClose = async () => {
    if (!closeReason.trim()) {
      toast.error('Please provide a reason for closing');
      return;
    }

    try {
      // ✅ FIXED: Using grievanceService.updateStatus() which exists
      await grievanceService.updateStatus(id, 'closed', closeReason);
      toast.success('Grievance closed. Refund will be processed shortly.');
      setShowCloseModal(false);
      await loadGrievance();
    } catch (error) {
      console.error('Error closing:', error);
      toast.error(error.message || 'Failed to close');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: grievance.title,
        text: grievance.description,
        url: url
      }).catch(() => {
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!grievance) {
    return null;
  }

  const tierConfig = GRIEVANCE_TIERS[grievance.tier?.toUpperCase()] || GRIEVANCE_TIERS.MICRO;
  const statusConfig = GRIEVANCE_STATUS[grievance.status?.toUpperCase()] || GRIEVANCE_STATUS.PENDING;
  const isOwner = auth.currentUser?.uid === grievance.userId;

  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className={`${tierConfig.bgColor} text-white py-8`}>
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/make-a-noise')}
            className="flex items-center gap-2 text-white hover:text-gray-200 mb-4"
          >
            <FaArrowLeft /> Back to All Grievances
          </button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 ${tierConfig.badgeColor} rounded-full text-sm font-bold`}>
                  {tierConfig.name}
                </span>
                <span className={`px-3 py-1 ${statusConfig.color} rounded-full text-sm font-semibold`}>
                  {statusConfig.label}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{grievance.title}</h1>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <FaUser /> {grievance.userName}
                </span>
                <span className="flex items-center gap-1">
                  <FaClock /> {formatDate(grievance.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <FaEye /> {grievance.viewCount || 0} views
                </span>
              </div>
            </div>

            {/* Action Buttons (Owner Only) */}
            {isOwner && (
              <div className="flex gap-2">
                {canUserEdit(grievance.status) && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit /> Edit
                  </button>
                )}
                {canUserClose(grievance.status) && (
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                  >
                    <FaTimes /> Close
                  </button>
                )}
                {canUserDelete(grievance.status) && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                  >
                    <FaTrash /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {grievance.description}
              </div>
            </div>

            {/* Progress Tracking */}
            {progress && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaChartLine /> Progress Tracking
                </h2>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    {PROGRESS_STAGES.map((stage) => (
                      <div key={stage.id} className="text-center flex-1">
                        <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold ${
                          progress.currentStage >= stage.id
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {stage.id}
                        </div>
                        <div className="text-xs font-medium">{stage.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    <div 
                      className="absolute h-2 bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${((progress.currentStage - 1) / (PROGRESS_STAGES.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                {progress.updates && progress.updates.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3">Update Timeline</h3>
                    <div className="space-y-4">
                      {progress.updates.map((update, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">
                              {formatDate(update.timestamp)}
                            </div>
                            <div className="font-medium">{update.message}</div>
                            {update.note && (
                              <div className="text-sm text-gray-600 mt-1">{update.note}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {grievance.tags && grievance.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {grievance.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1">
                      <FaHashtag className="text-xs" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Converted to Article Notice */}
            {grievance.convertedToArticle && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                  <div className="flex items-start gap-4">
                    <FaCheckCircle className="text-white text-3xl mt-1" />
                    <div className="text-white">
                      <h3 className="font-bold text-xl mb-2">
                        Converted to Article
                      </h3>
                      <p className="opacity-90">
                        This grievance received significant community support and has been converted into an article.
                      </p>
                      {grievance.articleId && (
                        <button
                          onClick={() => navigate(`/article/${grievance.articleId}`)}
                          className="mt-4 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-semibold"
                        >
                          Read Full Article
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {grievance.readyForArticle && !grievance.convertedToArticle && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <FaExclamationCircle className="text-yellow-600 text-2xl mt-1" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">
                      Under Review for Article Conversion
                    </h3>
                    <p className="text-yellow-800">
                      This grievance has received enough votes and is being reviewed by our editorial team for conversion into an article.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voting Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold mb-4">Community Voting</h3>
              <div className="space-y-4">
                {/* ✅ FIXED: Using correct vote type 'upvote' */}
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={voting}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                    userVote === 'upvote'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-600'
                  } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FaThumbsUp />
                  <span>Upvote ({grievance.upvotes || 0})</span>
                </button>

                {/* ✅ FIXED: Using correct vote type 'downvote' */}
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={voting}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                    userVote === 'downvote'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600'
                  } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FaThumbsDown />
                  <span>Downvote ({grievance.downvotes || 0})</span>
                </button>

                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {grievance.netVotes > 0 ? '+' : ''}{grievance.netVotes || 0}
                  </div>
                  <div className="text-sm text-gray-600">Net Votes</div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-red-500 mt-1" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-gray-600">
                      {grievance.city}, {grievance.state}
                      {grievance.pincode && ` - ${grievance.pincode}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FaBuilding className="text-blue-500 mt-1" />
                  <div>
                    <div className="font-medium">Department</div>
                    <div className="text-gray-600 capitalize">
                      {DEPARTMENT_CATEGORIES.find(d => d.id === grievance.department)?.label || grievance.department}
                    </div>
                    {grievance.departmentName && (
                      <div className="text-gray-500 text-xs mt-1">{grievance.departmentName}</div>
                    )}
                  </div>
                </div>

                {grievance.officerName && (
                  <div className="flex items-start gap-3">
                    <FaUser className="text-purple-500 mt-1" />
                    <div>
                      <div className="font-medium">Officer Involved</div>
                      <div className="text-gray-600">{grievance.officerName}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <FaClock className="text-gray-500 mt-1" />
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-gray-600">{formatDate(grievance.createdAt)}</div>
                  </div>
                </div>

                {grievance.resolvedAt && (
                  <div className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-500 mt-1" />
                    <div>
                      <div className="font-medium">Resolved</div>
                      <div className="text-gray-600">{formatDate(grievance.resolvedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold mb-4">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tier</span>
                  <span className="font-semibold">{tierConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-semibold">{formatCurrency(grievance.paymentAmount || tierConfig.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund Amount</span>
                  <span className="font-semibold text-green-600">
                    {tierConfig.refund > 0 ? formatCurrency(tierConfig.refund) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-semibold ${
                    grievance.paymentStatus === 'completed' ? 'text-green-600' :
                    grievance.paymentStatus === 'refunded' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {grievance.paymentStatus?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <FaShare /> Share Grievance
            </button>
          </div>
        </div>
      </div>

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Close Grievance</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to close this grievance? 
              {tierConfig.refund > 0 && (
                <span className="block mt-2 text-green-600 font-semibold">
                  You will receive a refund of {formatCurrency(tierConfig.refund)}
                </span>
              )}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for closing *
              </label>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Please explain why you're closing this grievance..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Close Grievance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrievanceDetail;