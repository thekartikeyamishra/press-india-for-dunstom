import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { 
  createProfile, 
  ACCOUNT_TYPES 
} from '../../services/profileService';
import { 
  VERIFICATION_REQUIREMENTS,
  validateAge 
} from '../../utils/legalCompliance';
import toast from 'react-hot-toast';
import { FaUser, FaBuilding, FaNewspaper, FaShieldAlt } from 'react-icons/fa';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    bio: '',
    // Company fields
    companyName: '',
    registrationNumber: '',
    companyAddress: '',
    gstNumber: '',
    // Journalist fields
    mediaHouse: '',
    designation: '',
    pressCardNumber: ''
  });

  const accountTypes = [
    {
      type: ACCOUNT_TYPES.INDIVIDUAL,
      icon: FaUser,
      title: 'Individual User',
      description: 'For personal use and reading news',
      color: 'bg-blue-500'
    },
    {
      type: ACCOUNT_TYPES.COMPANY,
      icon: FaBuilding,
      title: 'Company/Organization',
      description: 'For businesses and organizations',
      color: 'bg-purple-500'
    },
    {
      type: ACCOUNT_TYPES.JOURNALIST,
      icon: FaNewspaper,
      title: 'Journalist/Reporter',
      description: 'For verified media professionals',
      color: 'bg-orange-500'
    }
  ];

  const handleAccountTypeSelect = (type) => {
    setAccountType(type);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate age for individual accounts
      if (accountType === ACCOUNT_TYPES.INDIVIDUAL) {
        if (!formData.dateOfBirth) {
          throw new Error('Date of birth is required');
        }
        
        if (!validateAge(formData.dateOfBirth)) {
          throw new Error('You must be 18 years or older to use Press India');
        }
      }

      // Create profile
      const profileData = {
        ...formData,
        accountType
      };

      await createProfile(user.uid, profileData);

      toast.success('Profile created successfully!');
      
      // Redirect to verification
      navigate('/profile/verification');

    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            {step === 1 
              ? 'Choose your account type to get started'
              : 'Fill in your details to continue'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-primary text-white' : 'bg-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Account Type</span>
            </div>
            
            <div className={`w-24 h-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-primary text-white' : 'bg-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Account Type Selection */}
        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-6">
            {accountTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.type}
                  onClick={() => handleAccountTypeSelect(type.type)}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition group"
                >
                  <div className={`${type.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Profile Details Form */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Individual-specific fields */}
              {accountType === ACCOUNT_TYPES.INDIVIDUAL && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth * (Must be 18+)
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </>
              )}

              {/* Company-specific fields */}
              {accountType === ACCOUNT_TYPES.COMPANY && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Registration Number *
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Address *
                    </label>
                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      rows="3"
                      required
                    />
                  </div>
                </>
              )}

              {/* Journalist-specific fields */}
              {accountType === ACCOUNT_TYPES.JOURNALIST && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media House/Organization *
                    </label>
                    <input
                      type="text"
                      name="mediaHouse"
                      value={formData.mediaHouse}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Reporter, Editor"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Press Card Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="pressCardNumber"
                      value={formData.pressCardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* Common fields continued */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio/About (Optional)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  rows="4"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Verification Requirements Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="text-blue-600 text-xl mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Verification Required
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      {VERIFICATION_REQUIREMENTS[accountType]?.description}
                    </p>
                    <p className="text-xs text-blue-600">
                      You will be asked to upload verification documents in the next step.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? 'Creating Profile...' : 'Continue to Verification'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;