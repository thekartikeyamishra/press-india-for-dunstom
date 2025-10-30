// E:\press-india\src\pages\MakeANoise.jsx
// ============================================
// MAKE A NOISE - Main Grievance Page
// Display all grievances with filtering and voting
// Complete, Error-Free, Production Ready
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import { 
  FaBullhorn,      // Using FaBullhorn instead of FaMegaphone
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaChartLine, 
  FaSort, 
  FaDownload 
} from 'react-icons/fa';
import GrievanceCard from '../components/grievance/GrievanceCard';
import { GRIEVANCE_TIERS, GRIEVANCE_STATUS, DEPARTMENT_CATEGORIES } from '../config/grievanceConfig';
import toast from 'react-hot-toast';

const MakeANoise = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('netVotes'); // netVotes, createdAt, upvotes
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadGrievances();
    loadStats();
  }, []);

  useEffect(() => {
    filterAndSortGrievances();
  }, [grievances, searchTerm, tierFilter, statusFilter, departmentFilter, sortBy]);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      const data = await grievanceService.getGrievances({ limit: 500 });
      setGrievances(data);
    } catch (error) {
      console.error('Error loading grievances:', error);
      toast.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await grievanceService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterAndSortGrievances = () => {
    let filtered = [...grievances];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g => 
        g.title?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term) ||
        g.handles?.some(h => h.includes(term)) ||
        g.city?.toLowerCase().includes(term) ||
        g.state?.toLowerCase().includes(term)
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(g => g.tier === tierFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(g => g.department === departmentFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'netVotes') {
        return (b.netVotes || 0) - (a.netVotes || 0);
      } else if (sortBy === 'upvotes') {
        return (b.upvotes || 0) - (a.upvotes || 0);
      } else if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    setFilteredGrievances(filtered);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      setLoading(true);
      const results = await grievanceService.searchGrievances(searchTerm);
      setGrievances(results);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrievance = () => {
    if (!auth.currentUser) {
      toast.error('Please login to create a grievance');
      navigate('/auth?mode=login');
      return;
    }
    navigate('/grievance/create');
  };

  const refresh = async () => {
    await loadGrievances();
    await loadStats();
    toast.success('Refreshed!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Title & Description */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                <FaBullhorn className="text-4xl" />
                <h1 className="text-4xl font-bold">Make A Noise</h1>
              </div>
              <p className="text-lg text-white/90 max-w-2xl">
                Your voice matters! Create, vote, and track grievances that affect your community.
                High-voted issues become featured articles on Press India.
              </p>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{stats.total || 0}</div>
                  <div className="text-sm">Total</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{stats.active || 0}</div>
                  <div className="text-sm">Active</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{stats.resolved || 0}</div>
                  <div className="text-sm">Resolved</div>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by title, hashtag (#), city, or department..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Search
              </button>
              <button
                onClick={handleCreateGrievance}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold flex items-center gap-2"
              >
                <FaPlus /> Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <FaFilter />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Quick Filters (Always Visible) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tier Filter */}
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Tiers</option>
                {Object.values(GRIEVANCE_TIERS).map(tier => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="netVotes">🔥 Most Voted</option>
                <option value="upvotes">👍 Most Upvoted</option>
                <option value="createdAt">🕐 Most Recent</option>
              </select>

              {/* Refresh */}
              <button
                onClick={refresh}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>

            {/* Results Count */}
            <div className="ml-auto text-gray-600">
              {filteredGrievances.length} grievance{filteredGrievances.length !== 1 && 's'} found
            </div>
          </div>

          {/* Extended Filters (Collapsible) */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Statuses</option>
                  {Object.values(GRIEVANCE_STATUS).map(status => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENT_CATEGORIES.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTierFilter('all');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                    setSortBy('netVotes');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grievances List */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : filteredGrievances.length === 0 ? (
          <div className="text-center py-20">
            <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">
              No grievances found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search or filters' : 'Be the first to create one!'}
            </p>
            <button
              onClick={handleCreateGrievance}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
            >
              <FaPlus /> Create Grievance
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredGrievances.map((grievance) => (
              <GrievanceCard 
                key={grievance.id} 
                grievance={grievance}
                onVote={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={handleCreateGrievance}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center z-50"
      >
        <FaPlus className="text-xl" />
      </button>
    </div>
  );
};

export default MakeANoise;