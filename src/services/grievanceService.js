/*
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  arrayUnion,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { 
  GRIEVANCE_TIERS, 
  GRIEVANCE_STATUS, 
  PAYMENT_STATUS,
  GRIEVANCE_CONFIG,
  getPaymentAmount,
  calculateRefund
} from '../config/grievanceConfig';

class GrievanceService {
  constructor() {
    this.collection = 'grievances';
    this.votesCollection = 'grievance_votes';
    this.progressCollection = 'grievance_progress';
    this.statsCollection = 'grievance_stats';
    this.cache = new Map();
    this.cacheTimeout = GRIEVANCE_CONFIG.CACHE_DURATION;
  }


  logError(error, context = '') {
    if (import.meta.env.DEV) {
      console.warn(`[${context}]`, error.message || error);
    }
  }


  generateHandles(title, department, city, state) {
    const handles = [];
    
    try {
      // Title-based hashtags
      const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);
      titleWords.slice(0, 3).forEach(word => {
        handles.push(`#${word.replace(/[^a-z0-9]/g, '')}`);
      });
      
      // Location-based hashtags
      if (city) handles.push(`#${city.toLowerCase().replace(/\s+/g, '')}`);
      if (state) handles.push(`#${state.toLowerCase().replace(/\s+/g, '')}`);
      
      // Department hashtag
      if (department) handles.push(`#${department.toLowerCase().replace(/\s+/g, '')}`);
    } catch (error) {
      this.logError(error, 'generateHandles');
    }
    
    return [...new Set(handles)]; // Remove duplicates
  }


  async createGrievance(grievanceData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create a grievance');
      }

      if (!grievanceData.title || grievanceData.title.length < GRIEVANCE_CONFIG.MIN_TITLE_LENGTH) {
        throw new Error(`Title must be at least ${GRIEVANCE_CONFIG.MIN_TITLE_LENGTH} characters`);
      }

      if (!grievanceData.description || grievanceData.description.length < GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH) {
        throw new Error(`Description must be at least ${GRIEVANCE_CONFIG.MIN_DESCRIPTION_LENGTH} characters`);
      }

      if (!grievanceData.tier) {
        throw new Error('Please select a priority tier');
      }

      if (!grievanceData.governmentIdType || !grievanceData.governmentIdNumber) {
        throw new Error('Government ID verification is required');
      }

      if (!grievanceData.department || !grievanceData.city || !grievanceData.state) {
        throw new Error('Please provide department and location details');
      }

      // Generate handles for searchability
      const handles = this.generateHandles(
        grievanceData.title,
        grievanceData.department,
        grievanceData.city,
        grievanceData.state
      );

      // Prepare grievance document
      const grievance = {
        // Basic info
        title: grievanceData.title.trim(),
        description: grievanceData.description.trim(),
        tier: grievanceData.tier,
        
        // User verification
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Anonymous',
        governmentIdType: grievanceData.governmentIdType,
        governmentIdNumber: this.encryptId(grievanceData.governmentIdNumber), // Encrypted
        isVerified: false, // Admin needs to verify
        
        // Department/Location
        department: grievanceData.department,
        departmentName: grievanceData.departmentName || '',
        officerName: grievanceData.officerName || '',
        city: grievanceData.city,
        state: grievanceData.state,
        pincode: grievanceData.pincode || '',
        
        // Status and tracking
        status: GRIEVANCE_STATUS.PENDING.id,
        paymentStatus: PAYMENT_STATUS.PENDING,
        currentStage: 1,
        
        // Engagement
        upvotes: 0,
        downvotes: 0,
        netVotes: 0,
        viewCount: 0,
        shareCount: 0,
        commentCount: 0,
        
        // Search and discovery
        handles: handles,
        tags: grievanceData.tags || [],
        searchableText: `${grievanceData.title} ${grievanceData.description} ${grievanceData.city} ${grievanceData.state} ${grievanceData.department}`.toLowerCase(),
        
        // Payment
        paymentAmount: getPaymentAmount(grievanceData.tier, import.meta.env.VITE_TEST_MODE === 'true'),
        refundAmount: calculateRefund(grievanceData.tier),
        paymentTransactionId: null,
        refundTransactionId: null,
        
        // Metadata
        attachments: grievanceData.attachments || [],
        isPublic: true,
        isFeatured: grievanceData.tier === 'top',
        convertedToArticle: false,
        articleId: null,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        resolvedAt: null,
        closedAt: null
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, this.collection), grievance);
      
      // Initialize progress tracking (don't await, non-critical)
      this.initializeProgress(docRef.id).catch(err => this.logError(err, 'initializeProgress'));
      
      // Update stats (don't await, non-critical)
      this.updateStats('created', grievanceData.tier).catch(err => this.logError(err, 'updateStats'));
      
      // Clear cache
      this.clearCache();
      
      console.log('✅ Grievance created:', docRef.id);
      
      return {
        id: docRef.id,
        ...grievance,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
    } catch (error) {
      this.logError(error, 'createGrievance');
      throw error; // Re-throw for form validation
    }
  }


  async initializeProgress(grievanceId) {
    try {
      const progressDoc = {
        grievanceId,
        stages: [
          {
            stage: 1,
            label: 'Submitted',
            completed: true,
            completedAt: serverTimestamp(),
            note: 'Grievance submitted successfully'
          }
        ],
        currentStage: 1,
        updates: [],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, this.progressCollection), progressDoc);
    } catch (error) {
      this.logError(error, 'initializeProgress');
    }
  }

  async getGrievance(grievanceId) {
    try {
      // Check cache
      const cacheKey = `grievance_${grievanceId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const docRef = doc(db, this.collection, grievanceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        lastActivityAt: docSnap.data().lastActivityAt?.toDate()
      };

      // Increment view count (don't await, non-critical)
      this.incrementViewCount(grievanceId).catch(err => this.logError(err, 'incrementViewCount'));

      // Cache it
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      this.logError(error, 'getGrievance');
      return null; // Return null instead of throwing
    }
  }


  async getGrievances(filters = {}) {
    try {
      const cacheKey = `grievances_${JSON.stringify(filters)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      let q = collection(db, this.collection);
      const constraints = [];

      // Apply filters
      if (filters.tier) {
        constraints.push(where('tier', '==', filters.tier));
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }

      if (filters.isPublic !== undefined) {
        constraints.push(where('isPublic', '==', filters.isPublic));
      }

      // Sorting
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      constraints.push(orderBy(sortBy, sortOrder));

      // Limit
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      // Build query
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const snapshot = await getDocs(q);
      const grievances = [];

      snapshot.forEach((doc) => {
        grievances.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastActivityAt: doc.data().lastActivityAt?.toDate()
        });
      });

      // Cache results
      this.cache.set(cacheKey, { data: grievances, timestamp: Date.now() });

      return grievances;
      
    } catch (error) {
      this.logError(error, 'getGrievances');
      // CRITICAL: Return empty array instead of throwing
      return [];
    }
  }


  async searchGrievances(searchText, filters = {}) {
    try {
      const allGrievances = await this.getGrievances(filters);
      
      if (!searchText || searchText.trim() === '') {
        return allGrievances;
      }
      
      const searchLower = searchText.toLowerCase();
      
      return allGrievances.filter(grievance => 
        grievance.title?.toLowerCase().includes(searchLower) ||
        grievance.description?.toLowerCase().includes(searchLower) ||
        grievance.city?.toLowerCase().includes(searchLower) ||
        grievance.state?.toLowerCase().includes(searchLower) ||
        grievance.department?.toLowerCase().includes(searchLower) ||
        grievance.handles?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      this.logError(error, 'searchGrievances');
      return [];
    }
  }

 
  async getTrendingGrievances(limitCount = 10) {
    try {
      return await this.getGrievances({
        sortBy: 'netVotes',
        sortOrder: 'desc',
        limit: limitCount,
        isPublic: true
      });
    } catch (error) {
      this.logError(error, 'getTrendingGrievances');
      return [];
    }
  }


  async getUserGrievances(userId = null) {
    try {
      const user = auth.currentUser;
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        return [];
      }

      return await this.getGrievances({
        userId: targetUserId,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    } catch (error) {
      this.logError(error, 'getUserGrievances');
      return [];
    }
  }


  async voteGrievance(grievanceId, voteType) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to vote');
      }

      if (!['up', 'down'].includes(voteType)) {
        throw new Error('Invalid vote type');
      }

      const voteRef = doc(db, this.votesCollection, `${grievanceId}_${user.uid}`);
      const voteSnap = await getDoc(voteRef);
      const grievanceRef = doc(db, this.collection, grievanceId);

      if (voteSnap.exists()) {
        const currentVote = voteSnap.data().type;
        
        if (currentVote === voteType) {
          // Remove vote
          await deleteDoc(voteRef);
          await updateDoc(grievanceRef, {
            [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(-1),
            netVotes: increment(voteType === 'up' ? -1 : 1)
          });
        } else {
          // Change vote
          await updateDoc(voteRef, { type: voteType });
          await updateDoc(grievanceRef, {
            upvotes: increment(voteType === 'up' ? 1 : -1),
            downvotes: increment(voteType === 'down' ? 1 : -1),
            netVotes: increment(voteType === 'up' ? 2 : -2)
          });
        }
      } else {
        // New vote
        await addDoc(collection(db, this.votesCollection), {
          grievanceId,
          userId: user.uid,
          type: voteType,
          createdAt: serverTimestamp()
        });
        await updateDoc(grievanceRef, {
          [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(1),
          netVotes: increment(voteType === 'up' ? 1 : -1)
        });
      }

      // Clear cache
      this.cache.delete(`grievance_${grievanceId}`);
      this.clearCache();

      return true;
    } catch (error) {
      this.logError(error, 'voteGrievance');
      throw error;
    }
  }


  async getUserVote(grievanceId) {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const voteRef = doc(db, this.votesCollection, `${grievanceId}_${user.uid}`);
      const voteSnap = await getDoc(voteRef);

      if (voteSnap.exists()) {
        return voteSnap.data().type;
      }

      return null;
    } catch (error) {
      this.logError(error, 'getUserVote');
      return null;
    }
  }


  async updateStatus(grievanceId, newStatus, note = '') {
    try {
      const grievanceRef = doc(db, this.collection, grievanceId);
      
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (newStatus === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      } else if (newStatus === 'closed') {
        updateData.closedAt = serverTimestamp();
      }

      await updateDoc(grievanceRef, updateData);

      // Add progress update
      if (note) {
        await this.addProgressUpdate(grievanceId, `Status changed to ${newStatus}`, note);
      }

      // Clear cache
      this.cache.delete(`grievance_${grievanceId}`);
      this.clearCache();

      return true;
    } catch (error) {
      this.logError(error, 'updateStatus');
      throw error;
    }
  }

  async addProgressUpdate(grievanceId, message, note = '') {
    try {
      const q = query(
        collection(db, this.progressCollection),
        where('grievanceId', '==', grievanceId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await this.initializeProgress(grievanceId);
      }

      const progressDoc = snapshot.docs[0];
      const progressRef = doc(db, this.progressCollection, progressDoc.id);

      await updateDoc(progressRef, {
        updates: arrayUnion({
          message,
          note,
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp()
        })
      });

      return true;
    } catch (error) {
      this.logError(error, 'addProgressUpdate');
      return false;
    }
  }


  async getProgress(grievanceId) {
    try {
      const q = query(
        collection(db, this.progressCollection),
        where('grievanceId', '==', grievanceId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    } catch (error) {
      this.logError(error, 'getProgress');
      return null;
    }
  }


  async getStats() {
    try {
      const cacheKey = 'grievance_stats';
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const allGrievances = await this.getGrievances({});

      const stats = {
        total: allGrievances.length,
        active: allGrievances.filter(g => g.status === 'active').length,
        resolved: allGrievances.filter(g => g.status === 'resolved').length,
        closed: allGrievances.filter(g => g.status === 'closed').length,
        byTier: {
          top: allGrievances.filter(g => g.tier === 'top').length,
          medium: allGrievances.filter(g => g.tier === 'medium').length,
          micro: allGrievances.filter(g => g.tier === 'micro').length
        },
        totalUpvotes: allGrievances.reduce((sum, g) => sum + (g.upvotes || 0), 0),
        totalVotes: allGrievances.reduce((sum, g) => sum + (g.netVotes || 0), 0),
        readyForArticle: allGrievances.filter(g => g.readyForArticle).length
      };

      this.cache.set(cacheKey, { data: stats, timestamp: Date.now() });

      return stats;
    } catch (error) {
      this.logError(error, 'getStats');
      // Return default stats instead of throwing
      return {
        total: 0,
        active: 0,
        resolved: 0,
        closed: 0,
        byTier: { top: 0, medium: 0, micro: 0 },
        totalUpvotes: 0,
        totalVotes: 0,
        readyForArticle: 0
      };
    }
  }


  async updateGrievance(grievanceId, updates) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in');
      }

      const grievance = await this.getGrievance(grievanceId);
      
      if (!grievance) {
        throw new Error('Grievance not found');
      }

      if (grievance.userId !== user.uid) {
        throw new Error('You can only edit your own grievances');
      }

      if (!['draft', 'pending', 'active'].includes(grievance.status)) {
        throw new Error('Cannot edit grievance in current status');
      }

      const grievanceRef = doc(db, this.collection, grievanceId);
      
      await updateDoc(grievanceRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Clear cache
      this.cache.delete(`grievance_${grievanceId}`);
      this.clearCache();

      return true;
    } catch (error) {
      this.logError(error, 'updateGrievance');
      throw error;
    }
  }


  async deleteGrievance(grievanceId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in');
      }

      const grievance = await this.getGrievance(grievanceId);
      
      if (!grievance) {
        throw new Error('Grievance not found');
      }

      if (grievance.userId !== user.uid) {
        throw new Error('You can only delete your own grievances');
      }

      if (grievance.status !== 'draft') {
        throw new Error('Can only delete draft grievances');
      }

      await deleteDoc(doc(db, this.collection, grievanceId));

      // Clear cache
      this.cache.delete(`grievance_${grievanceId}`);
      this.clearCache();

      return true;
    } catch (error) {
      this.logError(error, 'deleteGrievance');
      throw error;
    }
  }


  async flagForArticleConversion(grievanceId) {
    try {
      const grievanceRef = doc(db, this.collection, grievanceId);
      
      await updateDoc(grievanceRef, {
        readyForArticle: true,
        flaggedForArticleAt: serverTimestamp()
      });

      console.log(`🚩 Grievance ${grievanceId} flagged for article conversion`);
      
      return true;
    } catch (error) {
      this.logError(error, 'flagForArticleConversion');
      return false;
    }
  }


  async updateStats(action, data) {
    try {
      console.log(`📊 Stats updated: ${action}`, data);
    } catch (error) {
      this.logError(error, 'updateStats');
    }
  }

  async incrementViewCount(grievanceId) {
    try {
      const grievanceRef = doc(db, this.collection, grievanceId);
      await updateDoc(grievanceRef, {
        viewCount: increment(1)
      });
    } catch (error) {
      // Silent fail - not critical
      this.logError(error, 'incrementViewCount');
    }
  }

 
  encryptId(id) {
    try {
      // In production, use proper encryption
      return btoa(id); // Base64 encoding (NOT secure, just for demo)
    } catch (error) {
      this.logError(error, 'encryptId');
      return id;
    }
  }


  decryptId(encryptedId) {
    try {
      return atob(encryptedId);
    } catch (error) {
      this.logError(error, 'decryptId');
      return null;
    }
  }


  clearCache() {
    this.cache.clear();
    if (import.meta.env.DEV) {
      console.log('🗑️ Grievance cache cleared');
    }
  }
}

const grievanceService = new GrievanceService();
export default grievanceService;
*/

// E:\press-india\src\services\grievanceService.js
// ============================================
// GRIEVANCE SERVICE - FIXED INFINITE LOOP
// With Razorpay Payment Integration
// ============================================

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

class GrievanceService {
  constructor() {
    this.collection = 'grievances';
    this.votesCollection = 'grievance_votes';
    this.progressCollection = 'grievance_progress';
    this.paymentsCollection = 'payments';
    this.cache = new Map();
  }

  logError(error, context = '') {
    console.error(`[${context}]`, error.message || error);
  }

  /**
   * Create a new grievance (BEFORE PAYMENT)
   */
  async createGrievance(grievanceData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create a grievance');
      }

      // Validate required fields
      if (!grievanceData.title || grievanceData.title.length < 10) {
        throw new Error('Title must be at least 10 characters');
      }

      if (!grievanceData.description || grievanceData.description.length < 50) {
        throw new Error('Description must be at least 50 characters');
      }

      if (!grievanceData.tier) {
        throw new Error('Please select a priority tier');
      }

      if (!grievanceData.city || !grievanceData.state) {
        throw new Error('Please provide location details');
      }

      const now = Timestamp.now();
      
      // Prepare clean grievance data
      const grievance = {
        // Basic info
        title: String(grievanceData.title || '').trim(),
        description: String(grievanceData.description || '').trim(),
        tier: String(grievanceData.tier || 'micro'),
        
        // User info
        userId: String(user.uid),
        userEmail: String(user.email || ''),
        userName: String(user.displayName || 'Anonymous'),
        
        // Verification
        governmentIdType: String(grievanceData.governmentIdType || ''),
        governmentIdNumber: String(grievanceData.governmentIdNumber || ''),
        isVerified: false,
        
        // Location
        department: String(grievanceData.department || ''),
        departmentName: String(grievanceData.departmentName || ''),
        officerName: String(grievanceData.officerName || ''),
        city: String(grievanceData.city || ''),
        state: String(grievanceData.state || ''),
        pincode: String(grievanceData.pincode || ''),
        
        // Status - START WITH PENDING PAYMENT
        status: 'draft',
        paymentStatus: 'pending',
        currentStage: 0,
        
        // Payment amount based on tier
        paymentAmount: this.getPaymentAmount(grievanceData.tier),
        refundAmount: this.getRefundAmount(grievanceData.tier),
        paymentTransactionId: null,
        
        // Engagement metrics
        upvotes: 0,
        downvotes: 0,
        netVotes: 0,
        viewCount: 0,
        shareCount: 0,
        commentCount: 0,
        
        // Arrays
        tags: Array.isArray(grievanceData.tags) ? grievanceData.tags : [],
        attachments: Array.isArray(grievanceData.attachments) ? grievanceData.attachments : [],
        
        // Flags
        isPublic: false, // Not public until payment confirmed
        isFeatured: false,
        convertedToArticle: false,
        readyForArticle: false,
        
        // Timestamps
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      };

      console.log('✅ Creating grievance (payment pending):', grievance);

      // Add to Firestore
      const docRef = await addDoc(collection(db, this.collection), grievance);
      
      console.log('✅ Grievance created (ID: ' + docRef.id + ') - Awaiting payment');
      
      // Clear cache
      this.cache.clear();
      
      return {
        id: docRef.id,
        ...grievance,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        lastActivityAt: now.toDate()
      };
      
    } catch (error) {
      this.logError(error, 'createGrievance');
      throw error;
    }
  }

  /**
   * Get payment amount based on tier
   */
  getPaymentAmount(tier) {
    const amounts = {
      micro: 100,
      medium: 50000,
      top: 100000
    };
    return amounts[tier] || 100;
  }

  /**
   * Get refund amount based on tier
   */
  getRefundAmount(tier) {
    const refunds = {
      micro: 0,
      medium: 49750,
      top: 99000
    };
    return refunds[tier] || 0;
  }

  /**
   * Confirm payment and activate grievance
   */
  async confirmPayment(grievanceId, paymentData) {
    try {
      const now = Timestamp.now();
      const grievanceRef = doc(db, this.collection, grievanceId);
      
      // Update grievance with payment info
      await updateDoc(grievanceRef, {
        paymentStatus: 'completed',
        paymentTransactionId: paymentData.transactionId || null,
        paymentMethod: paymentData.method || 'razorpay',
        paymentCompletedAt: now,
        status: 'pending', // Move from draft to pending
        isPublic: true, // Now visible to public
        updatedAt: now
      });

      // Initialize progress tracking
      await this.initializeProgress(grievanceId);

      // Record payment in payments collection
      await addDoc(collection(db, this.paymentsCollection), {
        grievanceId,
        userId: auth.currentUser.uid,
        amount: paymentData.amount || 0,
        transactionId: paymentData.transactionId || null,
        method: paymentData.method || 'razorpay',
        status: 'success',
        createdAt: now
      });

      console.log('✅ Payment confirmed for grievance:', grievanceId);
      this.cache.clear();
      
      return true;
    } catch (error) {
      this.logError(error, 'confirmPayment');
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(grievanceId, error) {
    try {
      const grievanceRef = doc(db, this.collection, grievanceId);
      
      await updateDoc(grievanceRef, {
        paymentStatus: 'failed',
        paymentError: error || 'Payment failed',
        updatedAt: Timestamp.now()
      });

      // Record failed payment
      await addDoc(collection(db, this.paymentsCollection), {
        grievanceId,
        userId: auth.currentUser.uid,
        status: 'failed',
        error: error || 'Payment failed',
        createdAt: Timestamp.now()
      });

      console.log('❌ Payment failed for grievance:', grievanceId);
      return true;
    } catch (err) {
      this.logError(err, 'handlePaymentFailure');
      return false;
    }
  }

  /**
   * Initialize progress tracking - FIXED: No recursive call
   */
  async initializeProgress(grievanceId) {
    try {
      const progressData = {
        grievanceId: String(grievanceId),
        currentStage: 1,
        stages: [
          {
            stage: 1,
            label: 'Submitted',
            completed: true,
            completedAt: Timestamp.now(),
            note: 'Grievance submitted and payment confirmed'
          },
          {
            stage: 2,
            label: 'Under Review',
            completed: false,
            completedAt: null,
            note: ''
          },
          {
            stage: 3,
            label: 'In Progress',
            completed: false,
            completedAt: null,
            note: ''
          },
          {
            stage: 4,
            label: 'Resolved',
            completed: false,
            completedAt: null,
            note: ''
          }
        ],
        updates: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, this.progressCollection), progressData);
      console.log('✅ Progress tracking initialized for:', grievanceId);
      return true;
    } catch (error) {
      this.logError(error, 'initializeProgress');
      return false; // Don't throw, just return false
    }
  }

  /**
   * Get progress for a grievance - FIXED: No infinite loop
   */
  async getProgress(grievanceId) {
    try {
      const q = query(
        collection(db, this.progressCollection),
        where('grievanceId', '==', String(grievanceId)),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Return null if no progress found - DO NOT auto-initialize here
        console.log('No progress found for:', grievanceId);
        return null;
      }

      const data = snapshot.docs[0].data();
      
      return {
        id: snapshot.docs[0].id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      this.logError(error, 'getProgress');
      return null; // Return null on error
    }
  }

  /**
   * Add progress update
   */
  async addProgressUpdate(grievanceId, updateData) {
    try {
      const q = query(
        collection(db, this.progressCollection),
        where('grievanceId', '==', String(grievanceId)),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('No progress found to update');
        return false;
      }

      const progressRef = doc(db, this.progressCollection, snapshot.docs[0].id);
      
      await updateDoc(progressRef, {
        updates: arrayUnion({
          message: updateData.message || '',
          note: updateData.note || '',
          timestamp: Timestamp.now()
        }),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Progress update added');
      return true;
    } catch (error) {
      this.logError(error, 'addProgressUpdate');
      return false;
    }
  }

  /**
   * Update progress stage
   */
  async updateProgressStage(grievanceId, stage, completed = true, note = '') {
    try {
      const progress = await this.getProgress(grievanceId);
      if (!progress) return false;

      const stages = progress.stages || [];
      const stageIndex = stages.findIndex(s => s.stage === stage);
      
      if (stageIndex !== -1) {
        stages[stageIndex] = {
          ...stages[stageIndex],
          completed,
          completedAt: completed ? Timestamp.now() : null,
          note
        };

        const progressRef = doc(db, this.progressCollection, progress.id);
        await updateDoc(progressRef, {
          stages,
          currentStage: stage,
          updatedAt: Timestamp.now()
        });

        // Update grievance stage
        const grievanceRef = doc(db, this.collection, grievanceId);
        await updateDoc(grievanceRef, {
          currentStage: stage,
          updatedAt: Timestamp.now()
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logError(error, 'updateProgressStage');
      return false;
    }
  }

  /**
   * Get single grievance by ID
   */
  async getGrievance(grievanceId) {
    try {
      const docRef = doc(db, this.collection, grievanceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Increment view count (async, don't wait)
      this.incrementViewCount(grievanceId).catch(() => {});
      
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastActivityAt: data.lastActivityAt?.toDate() || new Date()
      };
    } catch (error) {
      this.logError(error, 'getGrievance');
      return null;
    }
  }

  /**
   * Get all grievances with filters
   */
  async getGrievances(filters = {}) {
    try {
      let q = collection(db, this.collection);
      const constraints = [];

      // Only show public grievances by default
      if (!filters.includePrivate) {
        constraints.push(where('isPublic', '==', true));
      }

      // Apply filters
      if (filters.tier) {
        constraints.push(where('tier', '==', filters.tier));
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }

      if (filters.department) {
        constraints.push(where('department', '==', filters.department));
      }

      if (filters.city) {
        constraints.push(where('city', '==', filters.city));
      }

      if (filters.state) {
        constraints.push(where('state', '==', filters.state));
      }

      // Sorting
      if (filters.sortBy === 'netVotes') {
        constraints.push(orderBy('netVotes', 'desc'));
      } else if (filters.sortBy === 'views') {
        constraints.push(orderBy('viewCount', 'desc'));
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      // Limit
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastActivityAt: doc.data().lastActivityAt?.toDate() || new Date()
      }));

    } catch (error) {
      this.logError(error, 'getGrievances');
      return [];
    }
  }

  /**
   * Get user's grievances (including private/unpaid)
   */
  async getUserGrievances(userId) {
    try {
      return await this.getGrievances({ userId, includePrivate: true });
    } catch (error) {
      this.logError(error, 'getUserGrievances');
      return [];
    }
  }

  /**
   * Vote on grievance
   */
  async vote(grievanceId, voteType) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to vote');
      }

      if (!['upvote', 'downvote'].includes(voteType)) {
        throw new Error('Invalid vote type');
      }

      // Check existing vote
      const voteQuery = query(
        collection(db, this.votesCollection),
        where('grievanceId', '==', grievanceId),
        where('userId', '==', user.uid),
        limit(1)
      );
      
      const voteSnapshot = await getDocs(voteQuery);
      const grievanceRef = doc(db, this.collection, grievanceId);
      
      if (!voteSnapshot.empty) {
        // User already voted
        const existingVote = voteSnapshot.docs[0];
        const existingVoteData = existingVote.data();
        
        if (existingVoteData.voteType === voteType) {
          // Remove vote
          await deleteDoc(doc(db, this.votesCollection, existingVote.id));
          
          const updates = { updatedAt: Timestamp.now() };
          if (voteType === 'upvote') {
            updates.upvotes = increment(-1);
            updates.netVotes = increment(-1);
          } else {
            updates.downvotes = increment(-1);
            updates.netVotes = increment(1);
          }
          
          await updateDoc(grievanceRef, updates);
          return { voted: false, voteType: null };
        } else {
          // Change vote
          await updateDoc(doc(db, this.votesCollection, existingVote.id), {
            voteType,
            updatedAt: Timestamp.now()
          });
          
          const updates = { updatedAt: Timestamp.now() };
          if (voteType === 'upvote') {
            updates.upvotes = increment(1);
            updates.downvotes = increment(-1);
            updates.netVotes = increment(2);
          } else {
            updates.upvotes = increment(-1);
            updates.downvotes = increment(1);
            updates.netVotes = increment(-2);
          }
          
          await updateDoc(grievanceRef, updates);
          return { voted: true, voteType };
        }
      } else {
        // New vote
        await addDoc(collection(db, this.votesCollection), {
          grievanceId,
          userId: user.uid,
          voteType,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        const updates = {
          updatedAt: Timestamp.now(),
          lastActivityAt: Timestamp.now()
        };
        
        if (voteType === 'upvote') {
          updates.upvotes = increment(1);
          updates.netVotes = increment(1);
        } else {
          updates.downvotes = increment(1);
          updates.netVotes = increment(-1);
        }
        
        await updateDoc(grievanceRef, updates);
        return { voted: true, voteType };
      }
    } catch (error) {
      this.logError(error, 'vote');
      throw error;
    }
  }

  /**
   * Get user's vote for a grievance
   */
  async getUserVote(grievanceId) {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const voteQuery = query(
        collection(db, this.votesCollection),
        where('grievanceId', '==', grievanceId),
        where('userId', '==', user.uid),
        limit(1)
      );
      
      const snapshot = await getDocs(voteQuery);
      
      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data().voteType;
    } catch (error) {
      this.logError(error, 'getUserVote');
      return null;
    }
  }

  /**
   * Update grievance status
   */
  async updateStatus(grievanceId, status, note = '') {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in');
      }

      const grievanceRef = doc(db, this.collection, grievanceId);
      
      const updates = {
        status,
        updatedAt: Timestamp.now(),
        lastActivityAt: Timestamp.now()
      };

      // If resolving, set resolved time
      if (status === 'resolved') {
        updates.resolvedAt = Timestamp.now();
      }

      await updateDoc(grievanceRef, updates);

      // Add progress update
      if (note) {
        await this.addProgressUpdate(grievanceId, {
          message: `Status changed to: ${status}`,
          note
        });
      }

      return true;
    } catch (error) {
      this.logError(error, 'updateStatus');
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const allGrievances = await this.getGrievances({});

      return {
        total: allGrievances.length,
        active: allGrievances.filter(g => g.status === 'active').length,
        resolved: allGrievances.filter(g => g.status === 'resolved').length,
        pending: allGrievances.filter(g => g.status === 'pending').length,
        byTier: {
          top: allGrievances.filter(g => g.tier === 'top').length,
          medium: allGrievances.filter(g => g.tier === 'medium').length,
          micro: allGrievances.filter(g => g.tier === 'micro').length
        },
        totalUpvotes: allGrievances.reduce((sum, g) => sum + (g.upvotes || 0), 0),
        totalVotes: allGrievances.reduce((sum, g) => sum + (g.netVotes || 0), 0)
      };
    } catch (error) {
      this.logError(error, 'getStats');
      return {
        total: 0,
        active: 0,
        resolved: 0,
        pending: 0,
        byTier: { top: 0, medium: 0, micro: 0 },
        totalUpvotes: 0,
        totalVotes: 0
      };
    }
  }

  /**
   * Update grievance
   */
  async updateGrievance(grievanceId, updates) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in');
      }

      const grievance = await this.getGrievance(grievanceId);
      
      if (!grievance) {
        throw new Error('Grievance not found');
      }

      if (grievance.userId !== user.uid) {
        throw new Error('You can only edit your own grievances');
      }

      const grievanceRef = doc(db, this.collection, grievanceId);
      
      await updateDoc(grievanceRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      this.cache.clear();
      return true;
    } catch (error) {
      this.logError(error, 'updateGrievance');
      throw error;
    }
  }

  /**
   * Delete grievance
   */
  async deleteGrievance(grievanceId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in');
      }

      const grievance = await this.getGrievance(grievanceId);
      
      if (!grievance) {
        throw new Error('Grievance not found');
      }

      if (grievance.userId !== user.uid) {
        throw new Error('You can only delete your own grievances');
      }

      await deleteDoc(doc(db, this.collection, grievanceId));

      this.cache.clear();
      return true;
    } catch (error) {
      this.logError(error, 'deleteGrievance');
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(grievanceId) {
    try {
      const grievanceRef = doc(db, this.collection, grievanceId);
      await updateDoc(grievanceRef, {
        viewCount: increment(1)
      });
    } catch {
      // Silent fail
    }
  }
}

const grievanceService = new GrievanceService();
export default grievanceService;
