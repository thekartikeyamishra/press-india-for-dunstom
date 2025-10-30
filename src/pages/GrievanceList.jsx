// E:\press-india\src\pages\GrievanceList.jsx
// ============================================
// GRIEVANCE LIST PAGE
// Display all grievances with filtering and search
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import { GRIEVANCE_TIERS } from '../config/grievanceConfig';
import {
  FaBullhorn,
  FaSearch,
  FaFilter,
  FaThumbsUp,
  FaThumbsDown,
  FaMapMarkerAlt,
  FaClock,
  FaFire,
  FaPlus
} from 'react-icons/fa';

const GrievanceList = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('netVotes');

  useEffect(() => {
    loadGrievances();
  }, [filterTier, filterStatus, sortBy]);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      
      const filters = {
        sortBy: sortBy,
        sortOrder: 'desc',
        isPublic: true
      };
      
      if (filterTier !== 'all') {
        filters.tier = filterTier;
      }
      
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }

      const data = await grievanceService.getGrievances(filters);
      setGrievances(data);
    } catch (error) {
      console.error('Error loading grievances:', error);
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      loadGrievances();
      return;
    }

    try {
      setLoading(true);
      const results = await grievanceService.searchGrievances(searchTerm, {
        isPublic: true
      });
      setGrievances(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierConfig = (tier) => {
    return GRIEVANCE_TIERS[tier?.toUpperCase()] || GRIEVANCE_TIERS.MICRO;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <FaBullhorn className="text-4xl" />
              <h1 className="text-4xl font-bold">Make A Noise</h1>
            </div>
            <p className="text-xl opacity-90 mb-6">
              Voice your concerns, get community support, drive change
            </p>
            
            {user && (
              <button
                onClick={() => navigate('/make-a-noise/create')}
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
              >
                <FaPlus />
                Create Grievance
              </button>
            )}
            
            {!user && (
              <button
                onClick={() => navigate('/auth?mode=signup&redirect=/make-a-noise/create')}
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Sign Up to Create Grievance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search grievances..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="top">Top Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="micro">Micro Priority</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="netVotes">Most Voted</option>
                <option value="createdAt">Most Recent</option>
                <option value="viewCount">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grievances List */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading grievances...</p>
            </div>
          ) : grievances.length === 0 ? (
            <div className="text-center py-12">
              <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No Grievances Found
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to raise your voice!
              </p>
              {user && (
                <button
                  onClick={() => navigate('/make-a-noise/create')}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition"
                >
                  Create First Grievance
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {grievances.map((grievance) => {
                const tierConfig = getTierConfig(grievance.tier);
                
                return (
                  <div
                    key={grievance.id}
                    onClick={() => navigate(`/make-a-noise/${grievance.id}`)}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: tierConfig.color + '20',
                              color: tierConfig.color
                            }}
                          >
                            {tierConfig.name}
                          </span>
                          
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(grievance.status)}`}>
                            {grievance.status?.replace('-', ' ').toUpperCase()}
                          </span>
                          
                          {grievance.isFeatured && (
                            <span className="flex items-center gap-1 text-orange-500">
                              <FaFire />
                              <span className="text-xs font-medium">Featured</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-primary">
                          {grievance.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {grievance.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-400" />
                            <span>{grievance.city}, {grievance.state}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            <span>
                              {grievance.createdAt ? new Date(grievance.createdAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-green-600">
                              <FaThumbsUp />
                              <span className="font-semibold">{grievance.upvotes || 0}</span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-red-600">
                              <FaThumbsDown />
                              <span className="font-semibold">{grievance.downvotes || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-2xl font-bold" style={{ color: grievance.netVotes >= 0 ? '#10b981' : '#ef4444' }}>
                          {grievance.netVotes >= 0 ? '+' : ''}{grievance.netVotes || 0}
                        </div>
                      </div>
                    </div>

                    {grievance.handles && grievance.handles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {grievance.handles.slice(0, 5).map((handle, index) => (
                          <span
                            key={index}
                            className="text-xs text-primary bg-blue-50 px-2 py-1 rounded"
                          >
                            {handle}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrievanceList;