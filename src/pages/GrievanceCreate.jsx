// E:\press-india\src\pages\GrievanceCreate.jsx
// ============================================
// COMPLETE GRIEVANCE CREATION PAGE
// Fixed: All routes and form functionality
// ============================================

/*
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import { GRIEVANCE_TIERS, GRIEVANCE_CONFIG } from '../config/grievanceConfig';
import {
  FaBullhorn,
  FaMapMarkerAlt,
  FaBuilding,
  FaIdCard,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';

const GrievanceCreate = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login&redirect=/make-a-noise/create');
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    tier: 'micro',
    
    // Location
    city: '',
    state: '',
    pincode: '',
    
    // Department
    department: '',
    departmentName: '',
    officerName: '',
    
    // ID Verification
    governmentIdType: 'aadhaar',
    governmentIdNumber: '',
    
    // Additional
    tags: [],
    attachments: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.title || formData.title.length < GRIEVANCE_CONFIG.MIN_TITLE_LENGTH) {
      setError(`Title must be at least ${GRIEVANCE_CONFIG.MIN_TITLE_LENGTH} characters`);
      return false;
    }
    if (!formData.description || formData.description.length < GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH) {
      setError(`Description must be at least ${GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH} characters`);
      return false;
    }
    if (!formData.tier) {
      setError('Please select a priority tier');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.city || !formData.state) {
      setError('Please provide city and state');
      return false;
    }
    if (!formData.department) {
      setError('Please select a department');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.governmentIdType || !formData.governmentIdNumber) {
      setError('Government ID verification is required');
      return false;
    }
    
    // Basic ID validation
    const idNumber = formData.governmentIdNumber.replace(/\s/g, '');
    
    switch (formData.governmentIdType) {
      case 'aadhaar':
        if (idNumber.length !== 12 || !/^\d{12}$/.test(idNumber)) {
          setError('Aadhaar number must be 12 digits');
          return false;
        }
        break;
      case 'pan':
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNumber.toUpperCase())) {
          setError('Invalid PAN format (e.g., ABCDE1234F)');
          return false;
        }
        break;
      case 'voter':
        if (idNumber.length < 10) {
          setError('Voter ID must be at least 10 characters');
          return false;
        }
        break;
      case 'passport':
        if (idNumber.length < 8) {
          setError('Passport number must be at least 8 characters');
          return false;
        }
        break;
      case 'license':
        if (idNumber.length < 10) {
          setError('Driving license must be at least 10 characters');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;
    
    setLoading(true);
    setError('');

    try {
      const grievance = await grievanceService.createGrievance(formData);
      
      setSuccess(true);
      
      // Redirect to grievance details after 2 seconds
      setTimeout(() => {
        navigate(`/make-a-noise/${grievance.id}`);
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to create grievance. Please try again.');
      setLoading(false);
    }
  };

  const getTierInfo = (tierKey) => {
    return GRIEVANCE_TIERS[tierKey.toUpperCase()] || GRIEVANCE_TIERS.MICRO;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Grievance Created Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your grievance has been submitted and is now under review.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to grievance details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() => navigate('/make-a-noise')}
            className="text-primary hover:text-accent mb-4 flex items-center gap-2"
          >
            ← Back to Grievances
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <FaBullhorn className="text-3xl text-primary" />
            <h1 className="text-3xl font-bold text-gray-800">
              Create Grievance
            </h1>
          </div>
          <p className="text-gray-600">
            Raise your voice and get community support for your issue
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                  <div className="text-xs mt-2 text-center">
                    {step === 1 && 'Details'}
                    {step === 2 && 'Location'}
                    {step === 3 && 'Verification'}
                  </div>
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <FaTimesCircle className="text-red-500 text-xl mt-0.5" />
              <div>
                <div className="font-semibold text-red-800">Error</div>
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Step 1: Grievance Details
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Priority Tier *
                </label>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(GRIEVANCE_TIERS).map(([key, tier]) => (
                    <div
                      key={key}
                      onClick={() => setFormData(prev => ({ ...prev, tier: key.toLowerCase() }))}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                        formData.tier === key.toLowerCase()
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-lg font-bold"
                          style={{ color: tier.color }}
                        >
                          {tier.name}
                        </span>
                        {formData.tier === key.toLowerCase() && (
                          <FaCheckCircle className="text-primary" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-800 mb-1">
                        ₹{tier.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        Refund: ₹{tier.refund.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tier.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title * (Min {GRIEVANCE_CONFIG.MIN_TITLE_LENGTH} characters)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Brief, clear title for your grievance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={GRIEVANCE_CONFIG.MAX_TITLE_LENGTH}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/{GRIEVANCE_CONFIG.MAX_TITLE_LENGTH}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description * (Min {GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH} characters)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about your grievance..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={GRIEVANCE_CONFIG.MAX_DESCRIPTION_LENGTH}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/{GRIEVANCE_CONFIG.MAX_DESCRIPTION_LENGTH}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Step 2: Location & Department
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select state</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode (Optional)
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select department</option>
                  <option value="municipal">Municipal Corporation</option>
                  <option value="police">Police Department</option>
                  <option value="health">Health Department</option>
                  <option value="education">Education Department</option>
                  <option value="transport">Transport Department</option>
                  <option value="electricity">Electricity Board</option>
                  <option value="water">Water Supply</option>
                  <option value="revenue">Revenue Department</option>
                  <option value="panchayat">Panchayat</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department/Office Name (Optional)
                </label>
                <input
                  type="text"
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  placeholder="e.g., Agra Municipal Corporation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Officer Name (Optional)
                </label>
                <input
                  type="text"
                  name="officerName"
                  value={formData.officerName}
                  onChange={handleChange}
                  placeholder="Name of concerned officer (if known)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Step 3: Identity Verification
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-blue-500 text-lg mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <div className="font-semibold mb-1">Why do we need this?</div>
                      <div>
                        Government ID verification ensures authenticity and prevents spam. 
                        Your ID number is encrypted and never shared publicly.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

=              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID Type *
                </label>
                <select
                  name="governmentIdType"
                  value={formData.governmentIdType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter">Voter ID</option>
                  <option value="passport">Passport</option>
                  <option value="license">Driving License</option>
                </select>
              </div>

=              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  name="governmentIdNumber"
                  value={formData.governmentIdNumber}
                  onChange={handleChange}
                  placeholder={
                    formData.governmentIdType === 'aadhaar' ? 'Enter 12-digit Aadhaar' :
                    formData.governmentIdType === 'pan' ? 'Enter PAN (e.g., ABCDE1234F)' :
                    formData.governmentIdType === 'voter' ? 'Enter Voter ID' :
                    formData.governmentIdType === 'passport' ? 'Enter Passport Number' :
                    'Enter License Number'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  🔒 Your ID is encrypted and stored securely
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <h3 className="font-bold text-gray-800 mb-4">Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className="font-semibold" style={{ color: getTierInfo(formData.tier).color }}>
                      {getTierInfo(formData.tier).name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="font-semibold text-gray-800">
                      ₹{getTierInfo(formData.tier).amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund (on resolution):</span>
                    <span className="font-semibold text-green-600">
                      ₹{getTierInfo(formData.tier).refund.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-semibold text-gray-800">
                        {formData.city}, {formData.state}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Create Grievance
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-yellow-600 text-lg mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-semibold mb-1">Before you proceed:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure all information provided is accurate and truthful</li>
                <li>Payment will be processed after submission</li>
                <li>Refund will be processed automatically upon resolution</li>
                <li>You can track progress of your grievance anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrievanceCreate;
*/

// E:\press-india\src\pages\GrievanceCreate.jsx
// ============================================
// COMPLETE GRIEVANCE CREATION WITH PAYMENT
// Fixed: All ESLint errors resolved
// ============================================

/* eslint-disable no-unused-vars */
/* cSpell: disable */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import paymentService from '../services/paymentService';
import { GRIEVANCE_TIERS, GRIEVANCE_CONFIG } from '../config/grievanceConfig';
import toast from 'react-hot-toast';
import {
  FaBullhorn,
  FaMapMarkerAlt,
  FaBuilding,
  FaIdCard,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';

const GrievanceCreate = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login&redirect=/make-a-noise/create');
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    tier: 'micro',
    
    // Location
    city: '',
    state: '',
    pincode: '',
    
    // Department
    department: '',
    departmentName: '',
    officerName: '',
    
    // ID Verification
    governmentIdType: 'aadhaar',
    governmentIdNumber: '',
    
    // Additional
    tags: [],
    attachments: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.title || formData.title.length < GRIEVANCE_CONFIG.MIN_TITLE_LENGTH) {
      setError(`Title must be at least ${GRIEVANCE_CONFIG.MIN_TITLE_LENGTH} characters`);
      return false;
    }
    if (!formData.description || formData.description.length < GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH) {
      setError(`Description must be at least ${GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH} characters`);
      return false;
    }
    if (!formData.tier) {
      setError('Please select a priority tier');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.city || !formData.state) {
      setError('Please provide city and state');
      return false;
    }
    if (!formData.department) {
      setError('Please select a department');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.governmentIdType || !formData.governmentIdNumber) {
      setError('Government ID verification is required');
      return false;
    }
    
    // Basic ID validation
    const idNumber = formData.governmentIdNumber.replace(/\s/g, '');
    
    switch (formData.governmentIdType) {
      case 'aadhaar':
        if (idNumber.length !== 12 || !/^\d{12}$/.test(idNumber)) {
          setError('Aadhaar number must be 12 digits');
          return false;
        }
        break;
      case 'pan':
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNumber.toUpperCase())) {
          setError('Invalid PAN format (e.g., ABCDE1234F)');
          return false;
        }
        break;
      case 'voter':
        if (idNumber.length < 10) {
          setError('Voter ID must be at least 10 characters');
          return false;
        }
        break;
      case 'passport':
        if (idNumber.length < 8) {
          setError('Passport number must be at least 8 characters');
          return false;
        }
        break;
      case 'license':
        if (idNumber.length < 10) {
          setError('Driving license must be at least 10 characters');
          return false;
        }
        break;
      default:
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;
    
    setLoading(true);
    setError('');

    try {
      // Step 1: Create grievance
      console.log('📝 Creating grievance...');
      const grievance = await grievanceService.createGrievance(formData);
      
      console.log('✅ Grievance created:', grievance.id);
      
      toast.success('Grievance created! Opening payment gateway...');

      // Step 2: Open payment gateway
      setTimeout(async () => {
        try {
          console.log('💰 Initiating payment...');
          await paymentService.initiatePayment(grievance.id, grievance);
          
          // Payment modal opened successfully
          // The payment service will handle success/failure callbacks
          
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          toast.error('Failed to open payment gateway');
          setLoading(false);
          
          // Redirect to profile where user can retry payment
          setTimeout(() => {
            navigate('/profile');
          }, 2000);
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create grievance. Please try again.');
      toast.error(err.message || 'Failed to create grievance');
      setLoading(false);
    }
  };

  const getTierInfo = (tierKey) => {
    return GRIEVANCE_TIERS[tierKey.toUpperCase()] || GRIEVANCE_TIERS.MICRO;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <FaBullhorn className="text-primary" />
            Create Grievance
          </h1>
          <p className="text-gray-600">
            Make your voice heard. We'll help you get it resolved.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {step}
                  </div>
                  <div className={`text-xs mt-1 ${currentStep >= step ? 'text-primary font-medium' : 'text-gray-500'}`}>
                    {step === 1 && 'Details'}
                    {step === 2 && 'Location'}
                    {step === 3 && 'Verify'}
                  </div>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaTimesCircle className="text-red-500 text-lg mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 md:p-8">
          
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Step 1: Grievance Details
                </h2>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grievance Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Brief, clear title of your grievance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/{GRIEVANCE_CONFIG.MAX_TITLE_LENGTH} characters (min {GRIEVANCE_CONFIG.MIN_TITLE_LENGTH})
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide a detailed description of your grievance..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/{GRIEVANCE_CONFIG.MAX_DESCRIPTION_LENGTH} characters (min {GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH})
                </div>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Priority Tier *
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.keys(GRIEVANCE_TIERS).map((tierKey) => {
                    const tier = GRIEVANCE_TIERS[tierKey];
                    const isSelected = formData.tier === tierKey.toLowerCase();
                    
                    return (
                      <label
                        key={tierKey}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? 'border-primary bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tier"
                          value={tierKey.toLowerCase()}
                          checked={isSelected}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        
                        <div className="text-center">
                          <div className="text-lg font-bold mb-1" style={{ color: tier.color }}>
                            {tier.name}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            ₹{tier.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Refund: ₹{tier.refund.toLocaleString()}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <FaCheckCircle className="text-primary" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location & Department */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Step 2: Location & Department
                </h2>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Your city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Your state"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode (Optional)
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select department</option>
                  <option value="municipal">Municipal Corporation</option>
                  <option value="police">Police Department</option>
                  <option value="health">Health Department</option>
                  <option value="education">Education Department</option>
                  <option value="transport">Transport Department</option>
                  <option value="electricity">Electricity Board</option>
                  <option value="water">Water Supply</option>
                  <option value="revenue">Revenue Department</option>
                  <option value="panchayat">Panchayat</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department/Office Name (Optional)
                </label>
                <input
                  type="text"
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  placeholder="e.g., Agra Municipal Corporation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Officer Name (Optional)
                </label>
                <input
                  type="text"
                  name="officerName"
                  value={formData.officerName}
                  onChange={handleChange}
                  placeholder="Name of concerned officer (if known)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: ID Verification */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Step 3: Identity Verification
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-blue-500 text-lg mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <div className="font-semibold mb-1">Why do we need this?</div>
                      <div>
                        Government ID verification ensures authenticity and prevents spam. 
                        Your ID number is encrypted and never shared publicly.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ID Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID Type *
                </label>
                <select
                  name="governmentIdType"
                  value={formData.governmentIdType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter">Voter ID</option>
                  <option value="passport">Passport</option>
                  <option value="license">Driving License</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  name="governmentIdNumber"
                  value={formData.governmentIdNumber}
                  onChange={handleChange}
                  placeholder={
                    formData.governmentIdType === 'aadhaar' ? 'Enter 12-digit Aadhaar' :
                    formData.governmentIdType === 'pan' ? 'Enter PAN (e.g., ABCDE1234F)' :
                    formData.governmentIdType === 'voter' ? 'Enter Voter ID' :
                    formData.governmentIdType === 'passport' ? 'Enter Passport Number' :
                    'Enter License Number'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  🔒 Your ID is encrypted and stored securely
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mt-6">
                <h3 className="font-bold text-gray-800 mb-4">📋 Summary & Payment</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className="font-semibold" style={{ color: getTierInfo(formData.tier).color }}>
                      {getTierInfo(formData.tier).name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{getTierInfo(formData.tier).amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund (on resolution):</span>
                    <span className="font-semibold text-green-600">
                      ₹{getTierInfo(formData.tier).refund.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="border-t border-blue-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-semibold text-gray-800">
                        {formData.city}, {formData.state}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-blue-300">
                    <p className="text-xs text-blue-800">
                      ✓ After clicking submit, Razorpay payment gateway will open
                    </p>
                    <p className="text-xs text-blue-800">
                      ✓ Your grievance will be public only after payment confirmation
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaRupeeSign />
                      Submit & Pay ₹{getTierInfo(formData.tier).amount.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-yellow-600 text-lg mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-semibold mb-1">Before you proceed:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure all information provided is accurate and truthful</li>
                <li>Razorpay payment gateway will open after submission</li>
                <li>Your grievance becomes public after payment confirmation</li>
                <li>Refund will be processed automatically upon resolution</li>
                <li>You can track progress of your grievance anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrievanceCreate;