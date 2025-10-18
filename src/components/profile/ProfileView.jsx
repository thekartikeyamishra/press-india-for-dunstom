import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { getProfile, getVerificationStatus } from '../../services/profileService';
import { getUserArticles } from '../../services/articleService';
import toast from 'react-hot-toast';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendar,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaEdit,
  FaNewspaper,
  FaShieldAlt
} from 'react-icons/fa';

const ProfileView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [articleStats, setArticleStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    pending: 0
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load profile
      const profileData = await getProfile(user.uid);
      
      if (!profileData) {
        toast.error('Profile not found. Please complete your profile.');
        navigate('/profile/setup');
        return;
      }

      setProfile(profileData);

      // Load verification status
      const status = await getVerificationStatus(user.uid);
      setVerificationStatus(status);

      // Load article stats
      const articles = await getUserArticles(user.uid);
      const stats = {
        total: articles.length,
        published: articles.filter(a => a.status === 'published').length,
        draft: articles.filter(a => a.status === 'draft').length,
        pending: articles.filter(a => a.status === 'pending_review').length
      };
      setArticleStats(stats);

    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusBadge = () => {
    if (profile?.verified) {
      return (
        <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <FaCheckCircle />
          Verified
        </span>
      );
    }

    if (verificationStatus?.status === 'in_review' || verificationStatus?.status === 'pending') {
      return (
        <span className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <FaClock />
          Verification Pending
        </span>
      );
    }

    if (verificationStatus?.status === 'rejected') {
      return (
        <span className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <FaTimesCircle />
          Verification Rejected
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          <FaClock />
          Not Verified
        </span>
      );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                {profile.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.fullName}
                </h1>
                <p className="text-gray-600 mb-3">
                  {profile.accountType?.charAt(0).toUpperCase() + profile.accountType?.slice(1)} Account
                </p>
                {getVerificationStatusBadge()}
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => navigate('/profile/edit')}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <FaEdit />
              Edit Profile
            </button>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FaEnvelope className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{auth.currentUser?.email}</p>
              </div>
            </div>

            {profile.phone && (
              <div className="flex items-center gap-3">
                <FaPhone className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}

            {profile.dateOfBirth && (
              <div className="flex items-center gap-3">
                <FaCalendar className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {new Date(profile.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <FaUser className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Company/Journalist Specific Info */}
        {profile.accountType === 'company' && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Company Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="font-medium text-gray-900">{profile.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Number</p>
                <p className="font-medium text-gray-900">{profile.registrationNumber}</p>
              </div>
              {profile.gstNumber && (
                <div>
                  <p className="text-sm text-gray-600">GST Number</p>
                  <p className="font-medium text-gray-900">{profile.gstNumber}</p>
                </div>
              )}
              {profile.companyAddress && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{profile.companyAddress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {profile.accountType === 'journalist' && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Media House</p>
                <p className="font-medium text-gray-900">{profile.mediaHouse}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Designation</p>
                <p className="font-medium text-gray-900">{profile.designation}</p>
              </div>
              {profile.pressCardNumber && (
                <div>
                  <p className="text-sm text-gray-600">Press Card Number</p>
                  <p className="font-medium text-gray-900">{profile.pressCardNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Article Statistics */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Article Statistics</h2>
            <button
              onClick={() => navigate('/articles/my')}
              className="text-primary hover:underline text-sm font-medium"
            >
              View All Articles →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FaNewspaper className="text-gray-400 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{articleStats.total}</p>
              <p className="text-sm text-gray-600">Total Articles</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{articleStats.published}</p>
              <p className="text-sm text-green-700">Published</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <FaClock className="text-yellow-500 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-900">{articleStats.pending}</p>
              <p className="text-sm text-yellow-700">Pending Review</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FaEdit className="text-gray-400 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{articleStats.draft}</p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        {!profile.verified && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <FaShieldAlt className="text-blue-600 text-3xl mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-2">
                  Complete Your Verification
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Get verified to publish articles and access all features of Press India.
                </p>
                <button
                  onClick={() => navigate('/profile/verification')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Start Verification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;