// src/components/grievance/GrievanceForm.jsx
// ============================================
// GRIEVANCE FORM COMPONENT - ERROR FREE
// Fixed: Correct imports from proper locations
// ============================================

// cSpell:ignore upvotes downvotes

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';

// ✅ CORRECT: Import configurations from grievanceConfig.js
import { 
  GRIEVANCE_TYPES,
  GRIEVANCE_TIERS,
  GOVERNMENT_ID_TYPES,
  DEPARTMENT_CATEGORIES,
  STATES,
  getPaymentAmount,
  formatCurrency,
  validateGovernmentId
} from '../../config/grievanceConfig';

// ✅ CORRECT: Import service functions from grievanceService.js
import grievanceService from '../../services/grievanceService';

import { 
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaMoneyBillWave
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const GrievanceForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    tier: '',
    title: '',
    description: '',
    department: '',
    departmentName: '',
    officerName: '',
    city: '',
    state: '',
    pincode: '',
    governmentIdType: '',
    governmentIdNumber: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Type validation
    if (!formData.type) {
      newErrors.type = 'Please select a grievance type';
    }

    // Tier validation
    if (!formData.tier) {
      newErrors.tier = 'Please select a priority tier';
    }

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must not exceed 200 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must not exceed 5000 characters';
    }

    // Department validation
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    // Location validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state) {
      newErrors.state = 'Please select a state';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    // Government ID validation
    if (!formData.governmentIdType) {
      newErrors.governmentIdType = 'Please select an ID type';
    }

    if (!formData.governmentIdNumber.trim()) {
      newErrors.governmentIdNumber = 'ID number is required';
    } else if (formData.governmentIdType) {
      const validation = validateGovernmentId(formData.governmentIdType, formData.governmentIdNumber);
      if (!validation.valid) {
        newErrors.governmentIdNumber = validation.error;
      }
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please login to submit a grievance');
      navigate('/auth?mode=login');
      return;
    }

    try {
      setLoading(true);

      // Prepare grievance data
      const grievanceData = {
        type: formData.type,
        tier: formData.tier,
        title: formData.title.trim(),
        description: formData.description.trim(),
        department: formData.department,
        departmentName: formData.departmentName?.trim() || '',
        officerName: formData.officerName?.trim() || '',
        city: formData.city.trim(),
        state: formData.state,
        pincode: formData.pincode.trim(),
        governmentId: {
          type: formData.governmentIdType,
          number: formData.governmentIdNumber.trim()
        },
        status: 'pending', // Pending payment
        paymentStatus: 'pending'
      };

      // ✅ CORRECT: Use grievanceService to create grievance
      const grievanceId = await grievanceService.createGrievance(
        grievanceData, 
        user.uid
      );

      toast.success('Grievance created successfully!');
      
      // Navigate to payment page or grievance detail
      navigate(`/grievance/${grievanceId}`);

    } catch (error) {
      console.error('Error submitting grievance:', error);
      toast.error(error.message || 'Failed to submit grievance');
    } finally {
      setLoading(false);
    }
  };

  const getTierConfig = (tierId) => {
    return Object.values(GRIEVANCE_TIERS).find(t => t.id === tierId);
  };

  const selectedTier = formData.tier ? getTierConfig(formData.tier) : null;
  const paymentAmount = selectedTier ? getPaymentAmount(selectedTier.id, true) : 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Submit a Grievance</h1>
        <p className="text-gray-600 mb-6">
          Make your voice heard. Submit your grievance and get community support.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grievance Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grievance Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Type</option>
              {Object.values(GRIEVANCE_TYPES).map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Priority Tier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Tier *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(GRIEVANCE_TIERS).map(tier => (
                <div
                  key={tier.id}
                  onClick={() => handleChange({ target: { name: 'tier', value: tier.id } })}
                  className={`relative cursor-pointer border-2 rounded-lg p-4 transition ${
                    formData.tier === tier.id
                      ? `${tier.borderColor} bg-${tier.color}-50`
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 ${tier.bgColor} text-white rounded text-xs font-bold`}>
                      {tier.badge}
                    </span>
                    <span className={`font-bold ${tier.textColor}`}>
                      {formatCurrency(tier.amount)}
                    </span>
                  </div>
                  <h3 className="font-bold mb-1">{tier.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{tier.description}</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {tier.features.map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                  {formData.tier === tier.id && (
                    <div className="absolute top-2 right-2">
                      <FaCheckCircle className="text-green-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.tier && (
              <p className="mt-1 text-sm text-red-600">{errors.tier}</p>
            )}
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
              placeholder="Brief description of your grievance"
              maxLength={200}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.title ? (
                <p className="text-sm text-red-600">{errors.title}</p>
              ) : (
                <p className="text-sm text-gray-500">Min 10 characters</p>
              )}
              <p className="text-sm text-gray-500">{formData.title.length}/200</p>
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
              rows={6}
              placeholder="Provide detailed information about your grievance..."
              maxLength={5000}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p className="text-sm text-red-600">{errors.description}</p>
              ) : (
                <p className="text-sm text-gray-500">Min 50 characters</p>
              )}
              <p className="text-sm text-gray-500">{formData.description.length}/5000</p>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department/Authority *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.department ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Department</option>
              {DEPARTMENT_CATEGORIES.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.icon} {dept.label}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-sm text-red-600">{errors.department}</p>
            )}
          </div>

          {/* Optional: Department Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department Name (Optional)
            </label>
            <input
              type="text"
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              placeholder="e.g., Mumbai Municipal Corporation"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Optional: Officer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Officer/Official Name (Optional)
            </label>
            <input
              type="text"
              name="officerName"
              value={formData.officerName}
              onChange={handleChange}
              placeholder="Name of concerned officer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select State</option>
                {STATES.map(state => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                maxLength={6}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.pincode ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.pincode && (
                <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
              )}
            </div>
          </div>

          {/* Government ID */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4">Verification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID Type *
                </label>
                <select
                  name="governmentIdType"
                  value={formData.governmentIdType}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.governmentIdType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select ID Type</option>
                  {Object.values(GOVERNMENT_ID_TYPES).map(idType => (
                    <option key={idType.id} value={idType.id}>
                      {idType.label}
                    </option>
                  ))}
                </select>
                {errors.governmentIdType && (
                  <p className="mt-1 text-sm text-red-600">{errors.governmentIdType}</p>
                )}
              </div>

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
                    formData.governmentIdType 
                      ? GOVERNMENT_ID_TYPES[formData.governmentIdType.toUpperCase()]?.placeholder 
                      : 'Enter ID number'
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.governmentIdNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.governmentIdNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.governmentIdNumber}</p>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <FaLock className="text-blue-600 mt-1 flex-shrink-0" />
                <p className="text-sm text-blue-900">
                  Your ID information is encrypted and used only for verification purposes. 
                  We never share your personal information with third parties.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {selectedTier && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaMoneyBillWave className="text-orange-600 text-2xl mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">Payment Information</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Tier:</strong> {selectedTier.badge}
                    </p>
                    <p>
                      <strong>Amount to Pay:</strong> {formatCurrency(paymentAmount)} (Test Mode)
                    </p>
                    <p>
                      <strong>Refund on Resolution:</strong> {formatCurrency(selectedTier.refund)}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Note: In production, you will pay {formatCurrency(selectedTier.amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1"
            />
            <label className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-red-600 hover:underline">
                Terms and Conditions
              </a>{' '}
              and confirm that all information provided is accurate. *
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-red-600 -mt-4">{errors.agreeToTerms}</p>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit & Proceed to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GrievanceForm;
