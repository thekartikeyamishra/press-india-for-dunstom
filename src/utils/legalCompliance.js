/**
 * Legal Compliance Utilities for Press India
 * Ensures platform complies with Indian IT Act, Press Council Guidelines, etc.
 */

// Legal disclaimers
export const LEGAL_DISCLAIMERS = {
  platform: {
    en: "Press India is a user-generated content platform. We are an intermediary under Section 79 of the IT Act, 2000. All content is provided by users and does not represent the views of Press India.",
    hi: "प्रेस इंडिया एक उपयोगकर्ता-जनित सामग्री मंच है। हम आईटी अधिनियम, 2000 की धारा 79 के तहत एक मध्यस्थ हैं। सभी सामग्री उपयोगकर्ताओं द्वारा प्रदान की जाती है।"
  },
  userContent: {
    en: "This article is submitted by a verified user. Press India is not responsible for the accuracy of user-generated content. Source verification is required but does not guarantee authenticity.",
    hi: "यह लेख एक सत्यापित उपयोगकर्ता द्वारा प्रस्तुत किया गया है। प्रेस इंडिया उपयोगकर्ता-जनित सामग्री की सटीकता के लिए जिम्मेदार नहीं है।"
  },
  liability: {
    en: "Press India acts only as an intermediary platform. We are not liable for user-generated content under Section 79 of IT Act, 2000, provided we act expeditiously upon receiving actual knowledge of unlawful content.",
    hi: "प्रेस इंडिया केवल एक मध्यस्थ मंच के रूप में कार्य करता है। आईटी अधिनियम, 2000 की धारा 79 के तहत हम उपयोगकर्ता-जनित सामग्री के लिए उत्तरदायी नहीं हैं।"
  }
};

// Content validation rules based on Indian law
export const CONTENT_RESTRICTIONS = {
  prohibited: [
    'defamatory',
    'obscene',
    'pornographic',
    'paedophilic',
    'invasive of privacy',
    'insulting on religious grounds',
    'racially objectionable',
    'relating to money laundering',
    'relating to terrorism',
    'threatening national security',
    'violating sovereignty of India'
  ],
  
  sensitiveKeywords: [
    // Political sensitivity
    'राष्ट्रीय सुरक्षा', 'national security', 'classified', 'गोपनीय',
    
    // Religious sensitivity  
    'धार्मिक', 'communal', 'सांप्रदायिक', 'blasphemy',
    
    // Financial crimes
    'money laundering', 'hawala', 'काला धन',
    
    // Terrorism
    'terrorist', 'terror', 'आतंकवाद', 'extremist',
    
    // Defamation triggers
    'fraud', 'scam', 'criminal', 'corrupt' // When used with specific names
  ],
  
  requiresExtraVerification: [
    'court', 'judge', 'verdict', 'अदालत',
    'police', 'arrest', 'investigation', 'पुलिस',
    'government', 'minister', 'सरकार', 'मंत्री',
    'military', 'army', 'सेना', 'defense'
  ]
};

// Verification requirements based on account type
export const VERIFICATION_REQUIREMENTS = {
  individual: {
    documents: ['aadhaar', 'pan', 'passport', 'driving_license'],
    requiredCount: 1,
    description: 'Any one government-issued photo ID'
  },
  company: {
    documents: ['company_registration', 'gst', 'pan'],
    requiredCount: 2,
    additionalInfo: ['company_name', 'registration_number', 'address'],
    description: 'Company registration certificate + GST/PAN'
  },
  journalist: {
    documents: ['press_card', 'employment_proof', 'pan'],
    requiredCount: 2,
    additionalInfo: ['media_house', 'designation'],
    description: 'Press card or employment proof from recognized media organization'
  }
};

// Mandatory disclaimers for articles
export const ARTICLE_DISCLAIMERS = {
  userGenerated: "Disclaimer: This is user-generated content. Press India does not verify claims made in user articles beyond basic fact-checking. Readers are advised to independently verify information.",
  
  opinion: "Disclaimer: This article contains opinions and views of the author. It does not represent the official stance of Press India.",
  
  unverified: "Notice: This article contains unverified claims. It is published in public interest but readers should exercise caution.",
  
  sources: "Source Disclosure: Sources cited in this article are listed below. Press India has made reasonable efforts to verify source authenticity but cannot guarantee accuracy."
};

/**
 * Check if content violates any legal restrictions
 */
export const validateContent = (content) => {
  const issues = [];
  const contentLower = content.toLowerCase();
  
  // Check for prohibited content patterns
  const prohibitedPatterns = [
    /child\s*(porn|abuse|exploitation)/gi,
    /(kill|murder|assassinate)\s*(pm|president|minister)/gi,
    /bomb\s*(making|instructions|tutorial)/gi,
    /fake\s*(currency|note|money)/gi
  ];
  
  prohibitedPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      issues.push({
        severity: 'critical',
        type: 'prohibited_content',
        message: 'Content contains potentially illegal material',
        requiresManualReview: true,
        autoReject: true
      });
    }
  });
  
  // Check for sensitive keywords requiring moderation
  CONTENT_RESTRICTIONS.sensitiveKeywords.forEach(keyword => {
    if (contentLower.includes(keyword.toLowerCase())) {
      issues.push({
        severity: 'high',
        type: 'sensitive_content',
        keyword: keyword,
        requiresManualReview: true,
        autoReject: false
      });
    }
  });
  
  return {
    isValid: issues.filter(i => i.autoReject).length === 0,
    issues,
    requiresReview: issues.some(i => i.requiresManualReview)
  };
};

/**
 * Generate legal footer for articles
 */
export const generateLegalFooter = (articleType, sources = []) => {
  let footer = `\n\n---\n\n`;
  
  // Main disclaimer
  footer += `**${ARTICLE_DISCLAIMERS.userGenerated}**\n\n`;
  
  // Source disclosure
  if (sources.length > 0) {
    footer += `**Sources:**\n`;
    sources.forEach((source, index) => {
      footer += `${index + 1}. ${source.name} - ${source.url}\n`;
    });
    footer += `\n`;
  }
  
  // Report mechanism
  footer += `**Report Issues:** If you believe this article contains false, misleading, or defamatory content, please [file a grievance](/grievances/report?article=${articleType}).\n\n`;
  
  // Platform disclaimer
  footer += `*${LEGAL_DISCLAIMERS.platform.en}*\n`;
  
  return footer;
};

/**
 * Sanitize user input to prevent XSS and injection
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Check if user meets age requirement (18+)
 */
export const validateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};

/**
 * Generate audit log entry
 */
export const createAuditLog = (action, userId, details) => {
  return {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: 'REDACTED', // IP logging handled server-side
    userAgent: navigator.userAgent
  };
};

/**
 * Terms of Service and Privacy Policy templates
 */
export const LEGAL_DOCUMENTS = {
  termsOfService: {
    version: '1.0',
    lastUpdated: '2025-01-01',
    url: '/legal/terms-of-service'
  },
  privacyPolicy: {
    version: '1.0',
    lastUpdated: '2025-01-01',
    url: '/legal/privacy-policy'
  },
  contentPolicy: {
    version: '1.0',
    lastUpdated: '2025-01-01',
    url: '/legal/content-policy'
  },
  grievanceRedressal: {
    version: '1.0',
    lastUpdated: '2025-01-01',
    url: '/legal/grievance-redressal',
    officerName: 'Grievance Officer',
    officerEmail: 'grievance@pressindia.com',
    officerPhone: '+91-XXXXXXXXXX',
    responseTime: '15 days as per IT Rules, 2021'
  }
};

export default {
  LEGAL_DISCLAIMERS,
  CONTENT_RESTRICTIONS,
  VERIFICATION_REQUIREMENTS,
  ARTICLE_DISCLAIMERS,
  LEGAL_DOCUMENTS,
  validateContent,
  generateLegalFooter,
  sanitizeInput,
  validateAge,
  createAuditLog
};