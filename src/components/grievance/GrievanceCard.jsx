// src/components/grievance/GrievanceCard.jsx
// ============================================
// GRIEVANCE CARD COMPONENT
// Display individual grievance with voting and details
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import grievanceService from '../../services/grievanceService';
import { 
  FaThumbsUp, 
  FaThumbsDown, 
  FaMapMarkerAlt, 
  FaBuilding, 
  FaHashtag,
  FaClock,
  FaEye,
  FaFire,
  FaChevronRight
} from 'react-icons/fa';
import { GRIEVANCE_TIERS, GRIEVANCE_STATUS } from '../../config/grievanceConfig';
import toast from 'react-hot-toast';

const GrievanceCard = ({ grievance, onVote }) => {
  const navigate = useNavigate();
  const [userVote, setUserVote] = useState(null);
  const [voting, setVoting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(grievance.upvotes || 0);
  const [localDownvotes, setLocalDownvotes] = useState(grievance.downvotes || 0);
  const [localNetVotes, setLocalNetVotes] = useState(grievance.netVotes || 0);

  const tierConfig = GRIEVANCE_TIERS[grievance.tier?.toUpperCase()] || GRIEVANCE_TIERS.MICRO;
  const statusConfig = GRIEVANCE_STATUS[grievance.status?.toUpperCase()] || GRIEVANCE_STATUS.PENDING;

  useEffect(() => {
    loadUserVote();
  }, [grievance.id]);

  const loadUserVote = async () => {
    if (auth.currentUser) {
      const vote = await grievanceService.getUserVote(grievance.id);
      setUserVote(vote);
    }
  };

  const handleVote = async (voteType) => {
    if (!auth.currentUser) {
      toast.error('Please login to vote');
      navigate('/login');
      return;
    }

    if (voting) return;

    try {
      setVoting(true);
      
      const result = await grievanceService.voteGrievance(grievance.id, voteType);
      
      // Update local state immediately for better UX
      setLocalUpvotes(prev => prev + result.upvoteChange);
      setLocalDownvotes(prev => prev + result.downvoteChange);
      setLocalNetVotes(result.newNetVotes);
      
      // Update user vote state
      if (userVote === voteType) {
        setUserVote(null); // Removed vote
      } else {
        setUserVote(voteType); // New or changed vote
      }

      // Call parent refresh
      if (onVote) {
        setTimeout(() => onVote(), 1000);
      }

    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on vote buttons
    if (e.target.closest('.vote-button')) {
      return;
    }
    navigate(`/grievance/${grievance.id}`);
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const seconds = Math.floor((new Date() - d) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer border border-gray-200 hover:border-red-300"
    >
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Tier Badge */}
          <div className={`px-3 py-1 ${tierConfig.bgColor} text-white rounded-full text-sm font-semibold flex items-center gap-1`}>
            {tierConfig.badge}
          </div>

          {/* Status Badge */}
          <div className={`px-3 py-1 bg-${statusConfig.color}-100 text-${statusConfig.color}-700 rounded-full text-sm font-medium flex items-center gap-1`}>
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </div>

          {/* Featured Badge (if top tier) */}
          {grievance.tier === 'top' && (
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
              <FaFire /> Featured
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-red-600 transition-colors">
          {grievance.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {grievance.description}
        </p>

        {/* Hashtags */}
        {grievance.handles && grievance.handles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {grievance.handles.slice(0, 5).map((handle, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
              >
                <FaHashtag className="text-xs" />
                {handle.replace('#', '')}
              </span>
            ))}
          </div>
        )}

        {/* Details Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm text-gray-600">
          {/* Location */}
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-500" />
            <span className="truncate">{grievance.city}, {grievance.state}</span>
          </div>

          {/* Department */}
          <div className="flex items-center gap-2">
            <FaBuilding className="text-blue-500" />
            <span className="truncate capitalize">{grievance.department}</span>
          </div>

          {/* Views */}
          <div className="flex items-center gap-2">
            <FaEye className="text-gray-400" />
            <span>{grievance.viewCount || 0} views</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <FaClock className="text-gray-400" />
            <span>{formatTimeAgo(grievance.createdAt)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Footer Row - Voting and Actions */}
        <div className="flex items-center justify-between">
          {/* Voting Section */}
          <div className="flex items-center gap-4">
            {/* Upvote Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote('up');
              }}
              disabled={voting}
              className={`vote-button flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                userVote === 'up'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-600'
              } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaThumbsUp />
              <span>{localUpvotes}</span>
            </button>

            {/* Downvote Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote('down');
              }}
              disabled={voting}
              className={`vote-button flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                userVote === 'down'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600'
              } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaThumbsDown />
              <span>{localDownvotes}</span>
            </button>

            {/* Net Votes Display */}
            <div className={`px-4 py-2 rounded-lg font-bold ${
              localNetVotes > 0 
                ? 'bg-green-50 text-green-700' 
                : localNetVotes < 0 
                ? 'bg-red-50 text-red-700' 
                : 'bg-gray-50 text-gray-700'
            }`}>
              {localNetVotes > 0 ? '+' : ''}{localNetVotes} Net
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={handleCardClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
          >
            View Details
            <FaChevronRight />
          </button>
        </div>

        {/* Article Conversion Notice */}
        {grievance.readyForArticle && !grievance.convertedToArticle && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 font-semibold">
              <FaFire className="text-yellow-500" />
              <span>This grievance is being considered for an article on Press India!</span>
            </div>
          </div>
        )}

        {/* Converted to Article Notice */}
        {grievance.convertedToArticle && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                ✅ Featured as article on Press India
              </div>
              {grievance.articleId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/article/${grievance.articleId}`);
                  }}
                  className="text-green-600 hover:text-green-700 font-semibold underline"
                >
                  Read Article
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrievanceCard;