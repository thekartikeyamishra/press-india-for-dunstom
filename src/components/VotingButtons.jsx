// E:\press-india\src\components\VotingButtons.jsx
// ============================================
// VOTING BUTTONS COMPONENT - Complete & Error-free
// ============================================

/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import toast from 'react-hot-toast';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

const VotingButtons = ({ grievanceId, initialUpvotes = 0, initialDownvotes = 0, initialNetVotes = 0 }) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [netVotes, setNetVotes] = useState(initialNetVotes);
  const [userVote, setUserVote] = useState(null); // 'upvote', 'downvote', or null
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  // Load user's vote on mount
  useEffect(() => {
    loadUserVote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grievanceId, user]);

  const loadUserVote = async () => {
    if (!user) return;
    
    try {
      const vote = await grievanceService.getUserVote(grievanceId);
      setUserVote(vote);
    } catch (error) {
      console.error('Error loading user vote:', error);
    }
  };

  const handleVote = async (voteType) => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please login to vote', {
        duration: 3000,
        icon: '🔒'
      });
      return;
    }

    // Prevent double-clicking
    if (loading) return;

    try {
      setLoading(true);

      // Optimistic update
      if (userVote === voteType) {
        // Remove vote
        if (voteType === 'upvote') {
          setUpvotes(prev => prev - 1);
          setNetVotes(prev => prev - 1);
        } else {
          setDownvotes(prev => prev - 1);
          setNetVotes(prev => prev + 1);
        }
        setUserVote(null);
      } else if (userVote === null) {
        // New vote
        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
          setNetVotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
          setNetVotes(prev => prev - 1);
        }
        setUserVote(voteType);
      } else {
        // Change vote
        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
          setDownvotes(prev => prev - 1);
          setNetVotes(prev => prev + 2);
        } else {
          setUpvotes(prev => prev - 1);
          setDownvotes(prev => prev + 1);
          setNetVotes(prev => prev - 2);
        }
        setUserVote(voteType);
      }

      // Call API
      const result = await grievanceService.vote(grievanceId, voteType);

      // Show feedback
      if (result.voted) {
        toast.success(
          voteType === 'upvote' ? '👍 Upvoted!' : '👎 Downvoted!',
          { duration: 2000 }
        );
      } else {
        toast.success('Vote removed', { duration: 2000 });
      }

    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote. Please try again.');
      
      // Revert on error
      setUpvotes(initialUpvotes);
      setDownvotes(initialDownvotes);
      setNetVotes(initialNetVotes);
      await loadUserVote();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          userVote === 'upvote'
            ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-md'
            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-green-50 hover:text-green-600 hover:border-green-200'
        } ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0'
        }`}
        title="Upvote this grievance"
      >
        <FaThumbsUp className={`transition-transform ${userVote === 'upvote' ? 'scale-125' : ''}`} />
        <span className="font-bold">{upvotes}</span>
      </button>

      {/* Net Score */}
      <div className="flex flex-col items-center px-4">
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Score</span>
        <span className={`text-2xl font-bold ${
          netVotes > 0 ? 'text-green-600' : 
          netVotes < 0 ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {netVotes > 0 ? '+' : ''}{netVotes}
        </span>
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          userVote === 'downvote'
            ? 'bg-red-100 text-red-700 border-2 border-red-500 shadow-md'
            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-200'
        } ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0'
        }`}
        title="Downvote this grievance"
      >
        <FaThumbsDown className={`transition-transform ${userVote === 'downvote' ? 'scale-125' : ''}`} />
        <span className="font-bold">{downvotes}</span>
      </button>
    </div>
  );
};

export default VotingButtons;