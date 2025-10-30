// src/config/grievanceConfig.js
// ============================================
// GRIEVANCE SYSTEM CONFIGURATION
// Tier-based grievance management with payment integration
// ============================================

// cSpell:ignore AADHAR aadhar Andhra Pradesh Arunachal Chhattisgarh Haryana Himachal
// cSpell:ignore Jharkhand Karnataka Madhya Meghalaya Mizoram Odisha Nadu Telangana
// cSpell:ignore Uttar Uttarakhand Dadra Nagar Haveli Jammu Ladakh Lakshadweep
// cSpell:ignore Puducherry upvotes downvotes

// ============================================
// GRIEVANCE TIERS
// ============================================
export const GRIEVANCE_TIERS = {
  TOP: {
    id: 'top',
    name: 'Top Priority',
    amount: 100000, // ₹1,00,000
    refund: 99000,  // ₹99,000
    fee: 1000,      // ₹1,000 (company fee)
    testAmount: 1,  // For testing
    color: 'red',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
    priority: 1,
    badge: '🔴 TOP PRIORITY',
    description: 'Highest priority - Gets immediate attention',
    features: [
      'Immediate escalation to authorities',
      'Daily progress updates',
      '99% refund on resolution/closure',
      'Featured visibility on platform'
    ]
  },
  MEDIUM: {
    id: 'medium',
    name: 'Medium Priority',
    amount: 50000,  // ₹50,000
    refund: 49750,  // ₹49,750
    fee: 250,       // ₹250 (company fee)
    testAmount: 1,  // For testing
    color: 'orange',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500',
    priority: 2,
    badge: '🟠 MEDIUM PRIORITY',
    description: 'Standard processing with good visibility',
    features: [
      'Weekly progress updates',
      '99.5% refund on resolution/closure',
      'Standard visibility',
      'Community voting enabled'
    ]
  },
  MICRO: {
    id: 'micro',
    name: 'Micro Priority',
    amount: 100,    // ₹100
    refund: 0,      // No refund
    fee: 100,       // ₹100 (company keeps all)
    testAmount: 1,  // For testing
    color: 'green',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
    priority: 3,
    badge: '🟢 MICRO PRIORITY',
    description: 'Basic tier - Community-driven resolution',
    features: [
      'Monthly progress updates',
      'No refund (commitment fee)',
      'Community voting',
      'Basic visibility'
    ]
  }
};

// ============================================
// GRIEVANCE TYPES
// ============================================
export const GRIEVANCE_TYPES = {
  PUBLIC: {
    id: 'public',
    label: 'Public Issue',
    description: 'Issue affecting public/community',
    icon: '👥'
  },
  PERSONAL: {
    id: 'personal',
    label: 'Personal Grievance',
    description: 'Individual issue or complaint',
    icon: '👤'
  },
  CORRUPTION: {
    id: 'corruption',
    label: 'Corruption',
    description: 'Report corruption or misconduct',
    icon: '⚖️'
  },
  SERVICE: {
    id: 'service',
    label: 'Service Issue',
    description: 'Problem with government service',
    icon: '🏛️'
  },
  INFRASTRUCTURE: {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Roads, water, electricity, etc.',
    icon: '🏗️'
  },
  ENVIRONMENT: {
    id: 'environment',
    label: 'Environment',
    description: 'Pollution, waste management, etc.',
    icon: '🌱'
  },
  OTHER: {
    id: 'other',
    label: 'Other',
    description: 'Other types of grievances',
    icon: '📋'
  }
};

// ============================================
// GRIEVANCE STATUS
// ============================================
export const GRIEVANCE_STATUS = {
  DRAFT: {
    id: 'draft',
    label: 'Draft',
    color: 'gray',
    icon: '📝',
    description: 'Being prepared'
  },
  PENDING: {
    id: 'pending',
    label: 'Pending Payment',
    color: 'yellow',
    icon: '⏳',
    description: 'Awaiting payment confirmation'
  },
  ACTIVE: {
    id: 'active',
    label: 'Active',
    color: 'blue',
    icon: '🔵',
    description: 'Being processed'
  },
  IN_PROGRESS: {
    id: 'in_progress',
    label: 'In Progress',
    color: 'indigo',
    icon: '🔄',
    description: 'Actively being worked on'
  },
  UNDER_REVIEW: {
    id: 'under_review',
    label: 'Under Review',
    color: 'purple',
    icon: '🔍',
    description: 'Being reviewed by authorities'
  },
  RESOLVED: {
    id: 'resolved',
    label: 'Resolved',
    color: 'green',
    icon: '✅',
    description: 'Successfully resolved'
  },
  CLOSED: {
    id: 'closed',
    label: 'Closed',
    color: 'gray',
    icon: '🔒',
    description: 'Closed without resolution'
  },
  REJECTED: {
    id: 'rejected',
    label: 'Rejected',
    color: 'red',
    icon: '❌',
    description: 'Not valid for processing'
  }
};

// ============================================
// GOVERNMENT ID TYPES
// ============================================
export const GOVERNMENT_ID_TYPES = {
  AADHAR: {
    id: 'aadhar',
    label: 'Aadhar Card',
    pattern: /^\d{12}$/,
    placeholder: '123456789012',
    maxLength: 12,
    validation: 'Must be 12 digits'
  },
  PAN: {
    id: 'pan',
    label: 'PAN Card',
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    placeholder: 'ABCDE1234F',
    maxLength: 10,
    validation: 'Must be in format: ABCDE1234F'
  },
  PASSPORT: {
    id: 'passport',
    label: 'Passport',
    pattern: /^[A-Z]{1}[0-9]{7}$/,
    placeholder: 'A1234567',
    maxLength: 8,
    validation: 'Must be in format: A1234567'
  },
  VOTER_ID: {
    id: 'voter_id',
    label: 'Voter ID',
    pattern: /^[A-Z]{3}[0-9]{7}$/,
    placeholder: 'ABC1234567',
    maxLength: 10,
    validation: 'Must be in format: ABC1234567'
  },
  DRIVING_LICENSE: {
    id: 'driving_license',
    label: 'Driving License',
    pattern: /^[A-Z]{2}[0-9]{13,14}$/,
    placeholder: 'DL1234567890123',
    maxLength: 16,
    validation: 'Must start with state code followed by numbers'
  }
};

// ============================================
// PAYMENT STATUS
// ============================================
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PROCESSING: 'processing'
};

// ============================================
// DEPARTMENT CATEGORIES
// ============================================
export const DEPARTMENT_CATEGORIES = [
  { id: 'municipal', label: 'Municipal Corporation', icon: '🏢' },
  { id: 'police', label: 'Police Department', icon: '👮' },
  { id: 'transport', label: 'Transport & Traffic', icon: '🚗' },
  { id: 'water', label: 'Water Supply', icon: '💧' },
  { id: 'electricity', label: 'Electricity Board', icon: '⚡' },
  { id: 'health', label: 'Health Department', icon: '🏥' },
  { id: 'education', label: 'Education Department', icon: '📚' },
  { id: 'revenue', label: 'Revenue Department', icon: '💰' },
  { id: 'environment', label: 'Environment & Pollution', icon: '🌱' },
  { id: 'other', label: 'Other Department', icon: '📋' }
];

// ============================================
// INDIAN STATES
// ============================================
export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// ============================================
// GENERAL CONFIG
// ============================================
export const GRIEVANCE_CONFIG = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_IMAGES: 5,
  MAX_VIDEOS: 2,
  MAX_DOCUMENTS: 5,
  VOTES_FOR_ARTICLE: 100, // Votes needed to be featured as article
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  TEST_MODE: true // Set to false in production
};

// ============================================
// PROGRESS STAGES
// ============================================
export const PROGRESS_STAGES = [
  { id: 'submitted', label: 'Submitted', icon: '📝' },
  { id: 'verified', label: 'Verified', icon: '✓' },
  { id: 'forwarded', label: 'Forwarded to Authority', icon: '📤' },
  { id: 'under_review', label: 'Under Review', icon: '🔍' },
  { id: 'action_taken', label: 'Action Taken', icon: '⚡' },
  { id: 'resolved', label: 'Resolved', icon: '✅' }
];

// ============================================
// REFUND REASONS
// ============================================
export const REFUND_REASONS = {
  RESOLVED: 'Grievance successfully resolved',
  CLOSED_BY_USER: 'Closed by user request',
  DUPLICATE: 'Duplicate grievance',
  INVALID: 'Invalid or inappropriate grievance',
  SYSTEM_ERROR: 'System error or technical issue'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tier configuration by ID
 */
export const getTierById = (tierId) => {
  return Object.values(GRIEVANCE_TIERS).find(t => t.id === tierId);
};

/**
 * Get status configuration by ID
 */
export const getStatusById = (statusId) => {
  return Object.values(GRIEVANCE_STATUS).find(s => s.id === statusId);
};

/**
 * Get grievance type by ID
 */
export const getTypeById = (typeId) => {
  return Object.values(GRIEVANCE_TYPES).find(t => t.id === typeId);
};

/**
 * Calculate refund amount based on tier
 */
export const calculateRefund = (tier) => {
  const tierConfig = getTierById(tier);
  return tierConfig ? tierConfig.refund : 0;
};

/**
 * Get payment amount based on tier and test mode
 */
export const getPaymentAmount = (tier, isTest = true) => {
  const tierConfig = getTierById(tier);
  if (!tierConfig) return 0;
  return isTest ? tierConfig.testAmount : tierConfig.amount;
};

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Check if user can edit grievance
 */
export const canUserEdit = (grievance, userId) => {
  if (!grievance || !userId) return false;
  return grievance.userId === userId && 
         ['draft', 'pending'].includes(grievance.status);
};

/**
 * Check if user can close grievance
 */
export const canUserClose = (grievance, userId) => {
  if (!grievance || !userId) return false;
  return grievance.userId === userId && 
         !['closed', 'resolved', 'rejected'].includes(grievance.status);
};

/**
 * Check if user can delete grievance
 */
export const canUserDelete = (grievance, userId) => {
  if (!grievance || !userId) return false;
  return grievance.userId === userId && 
         grievance.status === 'draft';
};

/**
 * Validate government ID
 */
export const validateGovernmentId = (type, value) => {
  const idType = Object.values(GOVERNMENT_ID_TYPES).find(t => t.id === type);
  if (!idType) return { valid: false, error: 'Invalid ID type' };
  
  if (!value || !value.trim()) {
    return { valid: false, error: 'ID number is required' };
  }
  
  if (!idType.pattern.test(value)) {
    return { valid: false, error: idType.validation };
  }
  
  return { valid: true };
};

/**
 * Check if grievance is ready for article conversion
 */
export const isReadyForArticle = (grievance) => {
  if (!grievance) return false;
  const netVotes = (grievance.upvotes || 0) - (grievance.downvotes || 0);
  return netVotes >= GRIEVANCE_CONFIG.VOTES_FOR_ARTICLE && 
         !grievance.convertedToArticle;
};

/**
 * Get priority label for tier
 */
export const getPriorityLabel = (tier) => {
  const tierConfig = getTierById(tier);
  return tierConfig ? tierConfig.badge : '🟢 MICRO PRIORITY';
};

/**
 * Calculate days since submission
 */
export const getDaysSinceSubmission = (createdAt) => {
  if (!createdAt) return 0;
  const now = new Date();
  const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  GRIEVANCE_TIERS,
  GRIEVANCE_TYPES,
  GRIEVANCE_STATUS,
  GOVERNMENT_ID_TYPES,
  PAYMENT_STATUS,
  DEPARTMENT_CATEGORIES,
  STATES,
  GRIEVANCE_CONFIG,
  PROGRESS_STAGES,
  REFUND_REASONS,
  getTierById,
  getStatusById,
  getTypeById,
  calculateRefund,
  getPaymentAmount,
  formatCurrency,
  canUserEdit,
  canUserClose,
  canUserDelete,
  validateGovernmentId,
  isReadyForArticle,
  getPriorityLabel,
  getDaysSinceSubmission
};
