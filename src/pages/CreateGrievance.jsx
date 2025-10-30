// src/pages/CreateGrievance.jsx
// ============================================
// CREATE GRIEVANCE FORM
// Multi-step form with payment integration
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import grievanceService from '../services/grievanceService';
import { 
  GRIEVANCE_TIERS, 
  GOVERNMENT_ID_TYPES, 
  DEPARTMENT_CATEGORIES,
  STATES,
  GRIEVANCE_CONFIG,
  getPaymentAmount,
  formatCurrency
} from '../config/grievanceConfig';
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaMoneyBillWave
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const CreateGrievance = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Tier, 2: Details, 3: Verification, 4: Review & Pay
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Tier Selection
    tier: '',
    
    // Step 2: Grievance Details
    title: '',
    description: '',
    department: '',
    departmentName: '',
    officerName: '',
    city: '',
    state: '',
    pincode: '',
    tags: [],
    
    // Step 3: Verification
    governmentIdType: '',
    governmentIdNumber: '',
    
    // Auto-filled
    userId: auth.currentUser?.uid || '',
    userEmail: auth.currentUser?.email || '',
    userName: auth.currentUser?.displayName || ''
  });

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      toast.error('Please login to create a grievance');
      navigate('/login');
    }
  }, []);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.tier) {
      newErrors.tier = 'Please select a priority tier';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.title || formData.title.length < GRIEVANCE_CONFIG.MIN_TITLE_LENGTH) {
      newErrors.title = `Title must be at least ${GRIEVANCE_CONFIG.MIN_TITLE_LENGTH} characters`;
    }
    
    if (!formData.description || formData.description.length < GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be at least ${GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH} characters`;
    }
    
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.governmentIdType) {
      newErrors.governmentIdType = 'Please select ID type';
    }
    
    if (!formData.governmentIdNumber) {
      newErrors.governmentIdNumber = 'ID number is required';
    } else {
      const idConfig = GOVERNMENT_ID_TYPES[formData.governmentIdType.toUpperCase()];
      if (idConfig && idConfig.pattern) {
        const regex = new RegExp(idConfig.pattern);
        if (!regex.test(formData.governmentIdNumber)) {
          newErrors.governmentIdNumber = `Invalid ${idConfig.label} format`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Create grievance
      const grievance = await grievanceService.createGrievance(formData);
      
      toast.success('Grievance created! Redirecting to payment...');
      
      // Redirect to Razorpay payment
      const paymentAmount = getPaymentAmount(formData.tier, import.meta.env.VITE_TEST_MODE === 'true');
      const razorpayLink = import.meta.env.VITE_RAZORPAY_LINK;
      const paymentUrl = `${razorpayLink}?amount=${paymentAmount}`;
      
      // Store grievance ID in localStorage for payment confirmation
      localStorage.setItem('pending_grievance_id', grievance.id);
      localStorage.setItem('pending_payment_amount', paymentAmount);
      
      // Open Razorpay in new tab
      window.open(paymentUrl, '_blank');
      
      // Redirect to grievance detail page
      setTimeout(() => {
        navigate(`/grievance/${grievance.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating grievance:', error);
      toast.error(error.message || 'Failed to create grievance');
    } finally {
      setLoading(false);
    }
  };

  const tierConfig = formData.tier ? GRIEVANCE_TIERS[formData.tier.toUpperCase()] : null;
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/make-a-noise')}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-4"
          >
            <FaArrowLeft /> Back to Grievances
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Grievance</h1>
          <p className="text-gray-600 mt-2">
            Help us help you resolve your concern. Choose your priority tier wisely.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step >= s ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > s ? <FaCheckCircle /> : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-red-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Select Tier</span>
            <span className={step >= 2 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Details</span>
            <span className={step >= 3 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Verify</span>
            <span className={step >= 4 ? 'text-red-600 font-semibold' : 'text-gray-500'}>Review & Pay</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* STEP 1: TIER SELECTION */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Select Priority Tier</h2>
              <p className="text-gray-600 mb-6">
                Choose the tier that best suits your grievance urgency and commitment level.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(GRIEVANCE_TIERS).map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => handleInputChange({ target: { name: 'tier', value: tier.id }})}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      formData.tier === tier.id
                        ? `${tier.borderColor} bg-${tier.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-2xl mb-2 ${tier.textColor}`}>
                      {tier.badge.split(' ')[0]}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{tier.description}</p>
                    
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(isTestMode ? tier.testAmount : tier.amount)}
                      </div>
                      {tier.refund > 0 && (
                        <div className="text-sm text-green-600">
                          {formatCurrency(tier.refund)} refund on resolution
                        </div>
                      )}
                      {tier.refund === 0 && (
                        <div className="text-sm text-gray-500">
                          No refund (commitment fee)
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 text-sm">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {errors.tier && (
                <p className="text-red-600 text-sm mt-4 flex items-center gap-2">
                  <FaExclamationTriangle /> {errors.tier}
                </p>
              )}

              {isTestMode && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
                    🧪 TEST MODE: Payments are set to ₹1 for testing purposes
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: GRIEVANCE DETAILS */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Grievance Details</h2>
              <p className="text-gray-600 mb-6">
                Provide detailed information about your grievance for better resolution.
              </p>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title * <span className="text-gray-500">({formData.title.length}/{GRIEVANCE_CONFIG.MAX_TITLE_LENGTH})</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    maxLength={GRIEVANCE_CONFIG.MAX_TITLE_LENGTH}
                    placeholder="Brief, descriptive title for your grievance"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                    }`}
                  />
                  {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description * <span className="text-gray-500">({formData.description.length}/{GRIEVANCE_CONFIG.MAX_DESCRIPTION_LENGTH})</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={GRIEVANCE_CONFIG.MAX_DESCRIPTION_LENGTH}
                    rows={8}
                    placeholder="Detailed description of your grievance, including what happened, when, and who is involved..."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                    }`}
                  />
                  {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.department ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                    }`}
                  >
                    <option value="">Select department</option>
                    {DEPARTMENT_CATEGORIES.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.icon} {dept.label}
                      </option>
                    ))}
                  </select>
                  {errors.department && <p className="text-red-600 text-sm mt-1">{errors.department}</p>}
                </div>

                {/* Department Name (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Department/Office Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleInputChange}
                    placeholder="e.g., Ward 23 Municipal Office"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Officer Name (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Officer/Person Involved (Optional)
                  </label>
                  <input
                    type="text"
                    name="officerName"
                    value={formData.officerName}
                    onChange={handleInputChange}
                    placeholder="Name of responsible person (if known)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Your city"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                      }`}
                    />
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                      }`}
                    >
                      <option value="">Select state</option>
                      {STATES.map(state => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
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
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Optional) - Add keywords for better searchability
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add a tag and press Enter"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-700 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Verify Your Identity</h2>
              <p className="text-gray-600 mb-6">
                We need to verify your identity to prevent spam and ensure accountability.
                Your ID information is encrypted and never shared publicly.
              </p>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaLock className="text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Your Privacy is Protected</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• ID numbers are encrypted and stored securely</li>
                      <li>• Only used for verification, never displayed publicly</li>
                      <li>• Complies with data protection regulations</li>
                      <li>• You can request deletion at any time</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* ID Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Government ID Type *
                  </label>
                  <select
                    name="governmentIdType"
                    value={formData.governmentIdType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.governmentIdType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                    }`}
                  >
                    <option value="">Select ID type</option>
                    {Object.values(GOVERNMENT_ID_TYPES).map(idType => (
                      <option key={idType.id} value={idType.id}>
                        {idType.icon} {idType.label}
                      </option>
                    ))}
                  </select>
                  {errors.governmentIdType && <p className="text-red-600 text-sm mt-1">{errors.governmentIdType}</p>}
                </div>

                {/* ID Number */}
                {formData.governmentIdType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {GOVERNMENT_ID_TYPES[formData.governmentIdType.toUpperCase()]?.label} Number *
                    </label>
                    <input
                      type="text"
                      name="governmentIdNumber"
                      value={formData.governmentIdNumber}
                      onChange={handleInputChange}
                      placeholder={GOVERNMENT_ID_TYPES[formData.governmentIdType.toUpperCase()]?.placeholder}
                      maxLength={GOVERNMENT_ID_TYPES[formData.governmentIdType.toUpperCase()]?.maxLength}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                        errors.governmentIdNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                      }`}
                    />
                    {errors.governmentIdNumber && <p className="text-red-600 text-sm mt-1">{errors.governmentIdNumber}</p>}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ <strong>Important:</strong> Providing false information may result in your grievance being rejected and potential legal action.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PAY */}
          {step === 4 && tierConfig && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Review & Pay</h2>
              <p className="text-gray-600 mb-6">
                Review your grievance details and proceed with payment to activate it.
              </p>

              {/* Summary */}
              <div className="space-y-6">
                {/* Tier Summary */}
                <div className={`border-2 ${tierConfig.borderColor} rounded-lg p-6`}>
                  <h3 className="text-lg font-bold mb-4">Selected Tier: {tierConfig.badge}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Payment Amount:</span>
                      <div className="text-2xl font-bold">
                        {formatCurrency(getPaymentAmount(formData.tier, isTestMode))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Refund on Resolution:</span>
                      <div className="text-2xl font-bold text-green-600">
                        {tierConfig.refund > 0 ? formatCurrency(tierConfig.refund) : 'No refund'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grievance Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-bold mb-3">Grievance Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {formData.title}</div>
                    <div><strong>Department:</strong> {formData.department}</div>
                    <div><strong>Location:</strong> {formData.city}, {formData.state}</div>
                    <div><strong>ID Type:</strong> {GOVERNMENT_ID_TYPES[formData.governmentIdType.toUpperCase()]?.label}</div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <FaMoneyBillWave className="text-green-600 text-2xl mt-1" />
                    <div>
                      <h3 className="font-bold text-green-900 mb-2">What Happens Next?</h3>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• You'll be redirected to Razorpay for secure payment</li>
                        <li>• Once payment is confirmed, your grievance becomes active</li>
                        <li>• You can track progress on your profile</li>
                        <li>• Refund processed automatically upon resolution/closure</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Payment is non-refundable except in case of resolution or user-initiated closure</li>
                    <li>Micro tier payments are completely non-refundable</li>
                    <li>Press India will make best efforts to resolve your grievance</li>
                    <li>Refunds are processed within 7-10 business days</li>
                    <li>High-voted grievances may be converted into articles</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowLeft /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Next <FaArrowRight />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaMoneyBillWave /> Proceed to Payment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGrievance;