import { db, auth } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { sanitizeInput, createAuditLog } from '../utils/legalCompliance';

/**
 * Grievance Service - Handles user complaints and reports
 */

// Grievance types
export const GRIEVANCE_TYPES = {
  FAKE_NEWS: 'fake_news',
  DEFAMATION: 'defamation',
  MISINFORMATION: 'misinformation',
  HATE_SPEECH: 'hate_speech',
  COPYRIGHT: 'copyright_violation',
  PRIVACY: 'privacy_violation',
  OFFENSIVE: 'offensive_content',
  SPAM: 'spam',
  OTHER: 'other'
};

// Grievance status
export const GRIEVANCE_STATUS = {
  SUBMITTED: 'submitted',
  ACKNOWLEDGED: 'acknowledged',
  IN_REVIEW: 'in_review',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated'
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Submit a grievance
 */
export const submitGrievance = async (grievanceData) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be logged in to submit grievance');
    }

    // Validate required fields
    if (!grievanceData.type || !grievanceData.description) {
      throw new Error('Grievance type and description are required');
    }

    const grievance = {
      // Reporter info
      reportedBy: user.uid,
      reporterName: user.displayName || 'Anonymous',
      reporterEmail: user.email,
      
      // Grievance details
      type: grievanceData.type,
      subject: sanitizeInput(grievanceData.subject || `Grievance: ${grievanceData.type}`),
      description: sanitizeInput(grievanceData.description),
      
      // Related content (if reporting article/news)
      relatedContentType: grievanceData.relatedContentType || null, // 'article', 'news', 'user'
      relatedContentId: grievanceData.relatedContentId || null,
      relatedContentUrl: sanitizeInput(grievanceData.relatedContentUrl || ''),
      
      // Supporting evidence
      evidence: grievanceData.evidence?.map(e => ({
        type: e.type, // 'link', 'screenshot', 'document'
        url: sanitizeInput(e.url),
        description: sanitizeInput(e.description || '')
      })) || [],
      
      // Status tracking
      status: GRIEVANCE_STATUS.SUBMITTED,
      priority: determinePriority(grievanceData.type),
      
      // Timestamps
      submittedAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null,
      
      // Admin fields
      assignedTo: null,
      adminNotes: [],
      resolution: null,
      
      // Auto-response sent
      autoResponseSent: true
    };

    const docRef = await addDoc(collection(db, 'grievances'), grievance);

    // Create audit log
    await addDoc(collection(db, 'adminLogs'), createAuditLog(
      'grievance_submitted',
      user.uid,
      { 
        grievanceId: docRef.id, 
        type: grievanceData.type,
        relatedContentId: grievanceData.relatedContentId 
      }
    ));

    // Auto-acknowledge
    await acknowledgeGrievance(docRef.id);

    return { 
      success: true, 
      grievanceId: docRef.id,
      message: 'Your grievance has been submitted successfully. You will receive updates on your registered email.',
      referenceNumber: `GRV-${docRef.id.substring(0, 8).toUpperCase()}`
    };
  } catch (error) {
    console.error('Error submitting grievance:', error);
    throw error;
  }
};

/**
 * Determine priority based on grievance type
 */
const determinePriority = (type) => {
  const highPriority = [
    GRIEVANCE_TYPES.HATE_SPEECH,
    GRIEVANCE_TYPES.DEFAMATION,
    GRIEVANCE_TYPES.PRIVACY
  ];
  
  const mediumPriority = [
    GRIEVANCE_TYPES.FAKE_NEWS,
    GRIEVANCE_TYPES.MISINFORMATION,
    GRIEVANCE_TYPES.COPYRIGHT
  ];
  
  if (highPriority.includes(type)) return PRIORITY_LEVELS.HIGH;
  if (mediumPriority.includes(type)) return PRIORITY_LEVELS.MEDIUM;
  return PRIORITY_LEVELS.LOW;
};

/**
 * Auto-acknowledge grievance
 */
const acknowledgeGrievance = async (grievanceId) => {
  try {
    await updateDoc(doc(db, 'grievances', grievanceId), {
      status: GRIEVANCE_STATUS.ACKNOWLEDGED,
      acknowledgedAt: new Date().toISOString(),
      adminNotes: [{
        note: 'Grievance received and acknowledged. Our team will review within 24-48 hours.',
        addedBy: 'system',
        addedAt: new Date().toISOString()
      }]
    });
  } catch (error) {
    console.error('Error acknowledging grievance:', error);
  }
};

/**
 * Get user's grievances
 */
export const getUserGrievances = async (userId) => {
  try {
    const q = query(
      collection(db, 'grievances'),
      where('reportedBy', '==', userId),
      orderBy('submittedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const grievances = [];

    querySnapshot.forEach(doc => {
      grievances.push({
        id: doc.id,
        ...doc.data(),
        referenceNumber: `GRV-${doc.id.substring(0, 8).toUpperCase()}`
      });
    });

    return grievances;
  } catch (error) {
    console.error('Error getting user grievances:', error);
    throw error;
  }
};

/**
 * Get grievance by ID
 */
export const getGrievanceById = async (grievanceId) => {
  try {
    const grievanceDoc = await getDoc(doc(db, 'grievances', grievanceId));
    
    if (!grievanceDoc.exists()) {
      return null;
    }

    return {
      id: grievanceDoc.id,
      ...grievanceDoc.data(),
      referenceNumber: `GRV-${grievanceDoc.id.substring(0, 8).toUpperCase()}`
    };
  } catch (error) {
    console.error('Error getting grievance:', error);
    throw error;
  }
};

/**
 * Report content (quick report)
 */
export const reportContent = async (contentId, contentType, reason, description = '') => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be logged in to report content');
    }

    const report = {
      reportedBy: user.uid,
      reporterName: user.displayName || 'Anonymous',
      contentId,
      contentType, // 'article', 'news', 'comment'
      reason,
      description: sanitizeInput(description),
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      action: null
    };

    const docRef = await addDoc(collection(db, 'contentReports'), report);

    // Increment report count on the content
    if (contentType === 'article') {
      const articleRef = doc(db, 'articles', contentId);
      const articleDoc = await getDoc(articleRef);
      
      if (articleDoc.exists()) {
        const reportCount = (articleDoc.data().reports || 0) + 1;
        
        await updateDoc(articleRef, {
          reports: reportCount,
          lastReportedAt: new Date().toISOString()
        });

        // Auto-flag if reports exceed threshold
        if (reportCount >= 5) {
          await updateDoc(articleRef, {
            status: 'flagged',
            flaggedAt: new Date().toISOString(),
            flagReason: 'Multiple user reports'
          });
        }
      }
    }

    return { 
      success: true, 
      reportId: docRef.id,
      message: 'Content reported successfully. Our team will review it.'
    };
  } catch (error) {
    console.error('Error reporting content:', error);
    throw error;
  }
};

/**
 * Check if user has already reported content
 */
export const hasUserReported = async (userId, contentId) => {
  try {
    const q = query(
      collection(db, 'contentReports'),
      where('reportedBy', '==', userId),
      where('contentId', '==', contentId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking report status:', error);
    return false;
  }
};

export default {
  GRIEVANCE_TYPES,
  GRIEVANCE_STATUS,
  PRIORITY_LEVELS,
  submitGrievance,
  getUserGrievances,
  getGrievanceById,
  reportContent,
  hasUserReported
};