import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { getUserGrievances, GRIEVANCE_STATUS } from '../services/grievanceService';
import toast from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaPlus,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

const MyGrievances = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadGrievances();
  }, []);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const data = await getUserGrievances(user.uid);
      setGrievances(data);
    } catch (error) {
      console.error('Error loading grievances:', error);
      toast.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case GRIEVANCE_STATUS.RESOLVED:
        return <FaCheckCircle className="text-green-500" />;
      case GRIEVANCE_STATUS.REJECTED:
        return <FaTimesCircle className="text-red-500" />;
      case GRIEVANCE_STATUS.IN_REVIEW:
      case GRIEVANCE_STATUS.INVESTIGATING:
        return <FaHourglassHalf className="text-yellow-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case GRIEVANCE_STATUS.RESOLVED:
        return 'bg-green-100 text-green-800';
      case GRIEVANCE_STATUS.REJECTED:
        return 'bg-red-100 text-red-800';
      case GRIEVANCE_STATUS.IN_REVIEW:
      case GRIEVANCE_STATUS.INVESTIGATING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your grievances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500 text-3xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Grievances</h1>
                <p className="text-gray-600">Track your reported issues</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/grievances/report')}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              <FaPlus />
              Report New Grievance
            </button>
          </div>
        </div>

        {/* Grievances List */}
        {grievances.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaExclamationTriangle className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No grievances yet
            </h3>
            <p className="text-gray-600 mb-6">
              If you encounter any issues or false information, you can report it here.
            </p>
            <button
              onClick={() => navigate('/grievances/report')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Report an Issue
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {grievances.map((grievance) => (
              <div
                key={grievance.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {/* Grievance Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {grievance.subject}
                        </h3>
                        {getStatusIcon(grievance.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Reference: <span className="font-mono font-semibold">{grievance.referenceNumber}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                        {grievance.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(grievance.priority)}`}>
                        {grievance.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>Type: <span className="font-medium">{grievance.type.replace('_', ' ')}</span></span>
                    <span>Filed: {new Date(grievance.submittedAt).toLocaleDateString()}</span>
                    {grievance.acknowledgedAt && (
                      <span>Acknowledged: {new Date(grievance.acknowledgedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Toggle Details Button */}
                  <button
                    onClick={() => setExpandedId(expandedId === grievance.id ? null : grievance.id)}
                    className="flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    {expandedId === grievance.id ? (
                      <>
                        <FaChevronUp />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <FaChevronDown />
                        View Details
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedId === grievance.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{grievance.description}</p>
                      </div>

                      {grievance.relatedContentUrl && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Related Content:</h4>
                          <a
                            href={grievance.relatedContentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {grievance.relatedContentUrl}
                          </a>
                        </div>
                      )}

                      {grievance.evidence && grievance.evidence.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Evidence:</h4>
                          <div className="space-y-2">
                            {grievance.evidence.map((item, index) => (
                              <div key={index} className="p-3 bg-white rounded-lg border">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {item.type}: {item.description}
                                </p>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline break-all"
                                >
                                  {item.url}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {grievance.adminNotes && grievance.adminNotes.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Updates:</h4>
                          <div className="space-y-2">
                            {grievance.adminNotes.map((note, index) => (
                              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-900 mb-1">{note.note}</p>
                                <p className="text-xs text-blue-700">
                                  {new Date(note.addedAt).toLocaleString()} - {note.addedBy}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {grievance.resolution && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">Resolution:</h4>
                          <p className="text-green-800">{grievance.resolution}</p>
                          {grievance.resolvedAt && (
                            <p className="text-xs text-green-700 mt-2">
                              Resolved on: {new Date(grievance.resolvedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGrievances;