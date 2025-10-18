// File: src/services/articleService.js

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';

// ==========================================
// CONSTANTS
// ==========================================
export const ARTICLE_CATEGORIES = [
  'politics',
  'business',
  'technology',
  'sports',
  'entertainment',
  'health',
  'science',
  'education',
  'opinion',
  'lifestyle',
  'world',
  'national',
  'local'
];

export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

// ==========================================
// IMAGE UPLOAD
// ==========================================
export const uploadArticleImage = async (file, articleId) => {
  try {
    if (!file) return null;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WEBP');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    const timestamp = Date.now();
    const filename = `articles/${articleId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// ==========================================
// CREATE ARTICLE
// ==========================================
export const createArticle = async (articleData, imageFile = null) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('You must be logged in to create an article');
    }

    // Create article document first with a temporary ID
    const tempArticleRef = doc(collection(db, 'articles'));
    const articleId = tempArticleRef.id;

    // Upload image if provided
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadArticleImage(imageFile, articleId);
    }

    // Create article document with all data
    const articleDoc = {
      ...articleData,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorEmail: user.email,
      status: ARTICLE_STATUS.DRAFT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: null,
      imageUrl: imageUrl,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0
    };

    await addDoc(collection(db, 'articles'), articleDoc);

    return { 
      success: true,
      articleId: articleId, 
      imageUrl 
    };
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

// ==========================================
// UPDATE ARTICLE
// ==========================================
export const updateArticle = async (articleId, updates, imageFile = null) => {
  try {
    const articleRef = doc(db, 'articles', articleId);

    // Upload new image if provided
    let imageUrl = updates.imageUrl;
    if (imageFile) {
      imageUrl = await uploadArticleImage(imageFile, articleId);
    }

    await updateDoc(articleRef, {
      ...updates,
      imageUrl,
      updatedAt: serverTimestamp()
    });

    return { success: true, imageUrl };
  } catch (error) {
    console.error('Error updating article:', error);
    throw error;
  }
};

// ==========================================
// DELETE ARTICLE
// ==========================================
export const deleteArticle = async (articleId, imageUrl = null) => {
  try {
    // Delete image from storage if exists
    if (imageUrl) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (imgError) {
        console.warn('Could not delete image:', imgError);
      }
    }

    // Delete article document
    await deleteDoc(doc(db, 'articles', articleId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
};

// ==========================================
// GET SINGLE ARTICLE
// ==========================================
export const getArticle = async (articleId) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    const articleSnap = await getDoc(articleRef);

    if (!articleSnap.exists()) {
      throw new Error('Article not found');
    }

    return {
      id: articleSnap.id,
      ...articleSnap.data()
    };
  } catch (error) {
    console.error('Error getting article:', error);
    throw error;
  }
};

// Alias for getArticle
export const getArticleById = getArticle;
// ==========================================
// SUBMIT ARTICLE FOR PUBLICATION (INSTANT PUBLISH)
// ==========================================
export const submitArticleForPublication = async (articleId) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    
    // Instant publish - no review needed
    await updateDoc(articleRef, {
      status: ARTICLE_STATUS.PUBLISHED,
      publishedAt: serverTimestamp(),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, published: true };
  } catch (error) {
    console.error('Error submitting article:', error);
    throw error;
  }
};

// ==========================================
// PUBLISH ARTICLE (Can be used by user or admin)
// ==========================================
export const publishArticle = async (articleId) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    
    await updateDoc(articleRef, {
      status: ARTICLE_STATUS.PUBLISHED,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error publishing article:', error);
    throw error;
  }
};

// ==========================================
// UNPUBLISH ARTICLE
// ==========================================
export const unpublishArticle = async (articleId) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    
    await updateDoc(articleRef, {
      status: ARTICLE_STATUS.DRAFT,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error unpublishing article:', error);
    throw error;
  }
};

// ==========================================
// REJECT ARTICLE (Admin only)
// ==========================================
export const rejectArticle = async (articleId, reason = '') => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    
    await updateDoc(articleRef, {
      status: ARTICLE_STATUS.REJECTED,
      rejectionReason: reason,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting article:', error);
    throw error;
  }
};

// ==========================================
// GET USER ARTICLES (WITH INDEX CHECK)
// ==========================================
export const getUserArticles = async (userId) => {
  try {
    // TRY with composite index first
    try {
      const q = query(
        collection(db, 'articles'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const articles = [];

      querySnapshot.forEach((doc) => {
        articles.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return articles;
    } catch (indexError) {
      // FALLBACK: If index doesn't exist, query without orderBy
      console.warn('Composite index not found, using simple query:', indexError.message);
      
      const q = query(
        collection(db, 'articles'),
        where('authorId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const articles = [];

      querySnapshot.forEach((doc) => {
        articles.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort in memory
      articles.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      return articles;
    }
  } catch (error) {
    console.error('Error getting user articles:', error);
    throw error;
  }
};

// Alias for getUserArticles
export const getArticlesByUser = getUserArticles;

// ==========================================
// GET PUBLISHED ARTICLES
// ==========================================
export const getPublishedArticles = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', ARTICLE_STATUS.PUBLISHED),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const articles = [];

    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by publishedAt in memory
    articles.sort((a, b) => {
      const dateA = a.publishedAt?.toDate?.() || new Date(0);
      const dateB = b.publishedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return articles;
  } catch (error) {
    console.error('Error getting published articles:', error);
    return [];
  }
};

// ==========================================
// GET ALL ARTICLES (PAGINATED)
// ==========================================
export const getAllArticles = async (limitCount = 20, lastDoc = null) => {
  try {
    let q = query(
      collection(db, 'articles'),
      where('status', '==', ARTICLE_STATUS.PUBLISHED),
      limit(limitCount)
    );

    // Add pagination if lastDoc provided
    if (lastDoc) {
      q = query(
        collection(db, 'articles'),
        where('status', '==', ARTICLE_STATUS.PUBLISHED),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const articles = [];
    let lastVisible = null;

    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
      lastVisible = doc;
    });

    // Sort by publishedAt in memory
    articles.sort((a, b) => {
      const dateA = a.publishedAt?.toDate?.() || new Date(0);
      const dateB = b.publishedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return { articles, lastVisible };
  } catch (error) {
    console.error('Error getting all articles:', error);
    return { articles: [], lastVisible: null };
  }
};
// ==========================================
// GET ARTICLES BY CATEGORY
// ==========================================
export const getArticlesByCategory = async (category, limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'articles'),
      where('category', '==', category),
      where('status', '==', ARTICLE_STATUS.PUBLISHED),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const articles = [];

    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by publishedAt in memory
    articles.sort((a, b) => {
      const dateA = a.publishedAt?.toDate?.() || new Date(0);
      const dateB = b.publishedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return articles;
  } catch (error) {
    console.error('Error getting articles by category:', error);
    return [];
  }
};

// ==========================================
// GET ARTICLES BY STATUS
// ==========================================
export const getArticlesByStatus = async (status, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', status),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const articles = [];

    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by updatedAt in memory
    articles.sort((a, b) => {
      const dateA = a.updatedAt?.toDate?.() || new Date(0);
      const dateB = b.updatedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return articles;
  } catch (error) {
    console.error('Error getting articles by status:', error);
    return [];
  }
};

// ==========================================
// INCREMENT ARTICLE VIEWS
// ==========================================
export const incrementArticleViews = async (articleId) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    const articleSnap = await getDoc(articleRef);

    if (articleSnap.exists()) {
      const currentViews = articleSnap.data().views || 0;
      await updateDoc(articleRef, {
        views: currentViews + 1
      });
    }
  } catch (error) {
    console.error('Error incrementing views:', error);
    // Don't throw - views are not critical
  }
};

// ==========================================
// LIKE ARTICLE
// ==========================================
export const likeArticle = async (articleId, userId) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    const articleSnap = await getDoc(articleRef);

    if (articleSnap.exists()) {
      const currentLikes = articleSnap.data().likes || 0;
      const likedBy = articleSnap.data().likedBy || [];
      
      // Check if user already liked
      if (likedBy.includes(userId)) {
        // Unlike
        await updateDoc(articleRef, {
          likes: Math.max(0, currentLikes - 1),
          likedBy: likedBy.filter(id => id !== userId)
        });
        return { likes: Math.max(0, currentLikes - 1), liked: false };
      } else {
        // Like
        await updateDoc(articleRef, {
          likes: currentLikes + 1,
          likedBy: [...likedBy, userId]
        });
        return { likes: currentLikes + 1, liked: true };
      }
    }
    return { likes: 0, liked: false };
  } catch (error) {
    console.error('Error liking article:', error);
    throw error;
  }
};

// ==========================================
// SEARCH ARTICLES
// ==========================================
export const searchArticles = async (searchTerm) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation that searches in title
    // For production, consider using Algolia or ElasticSearch
    
    const q = query(
      collection(db, 'articles'),
      where('status', '==', ARTICLE_STATUS.PUBLISHED)
    );
    
    const querySnapshot = await getDocs(q);
    const articles = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const titleMatch = data.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const summaryMatch = data.summary?.toLowerCase().includes(searchTerm.toLowerCase());
      const contentMatch = data.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = data.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (titleMatch || summaryMatch || contentMatch || categoryMatch) {
        articles.push({
          id: doc.id,
          ...data
        });
      }
    });

    // Sort by relevance (title matches first)
    articles.sort((a, b) => {
      const aTitle = a.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const bTitle = b.title?.toLowerCase().includes(searchTerm.toLowerCase());
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });

    return articles;
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
};

// ==========================================
// GET TRENDING ARTICLES
// ==========================================
export const getTrendingArticles = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', ARTICLE_STATUS.PUBLISHED)
    );

    const querySnapshot = await getDocs(q);
    const articles = [];

    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by views in memory
    articles.sort((a, b) => (b.views || 0) - (a.views || 0));

    return articles.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting trending articles:', error);
    return [];
  }
};

// ==========================================
// GET LATEST ARTICLES
// ==========================================
export const getLatestArticles = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', ARTICLE_STATUS.PUBLISHED),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const articles = [];

    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by publishedAt in memory
    articles.sort((a, b) => {
      const dateA = a.publishedAt?.toDate?.() || new Date(0);
      const dateB = b.publishedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return articles;
  } catch (error) {
    console.error('Error getting latest articles:', error);
    return [];
  }
};

// ==========================================
// GET ARTICLE STATS
// ==========================================
export const getArticleStats = async (articleId) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    const articleSnap = await getDoc(articleRef);

    if (!articleSnap.exists()) {
      return null;
    }

    const data = articleSnap.data();
    return {
      views: data.views || 0,
      likes: data.likes || 0,
      comments: data.comments || 0,
      shares: data.shares || 0
    };
  } catch (error) {
    console.error('Error getting article stats:', error);
    return null;
  }
};

// ==========================================
// UPDATE ARTICLE STATUS
// ==========================================
export const updateArticleStatus = async (articleId, status) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    
    const updates = {
      status: status,
      updatedAt: serverTimestamp()
    };

    // Add publishedAt if publishing
    if (status === ARTICLE_STATUS.PUBLISHED) {
      updates.publishedAt = serverTimestamp();
    }

    await updateDoc(articleRef, updates);

    return { success: true };
  } catch (error) {
    console.error('Error updating article status:', error);
    throw error;
  }
};

// ==========================================
// SAVE ARTICLE AS DRAFT
// ==========================================
export const saveArticleDraft = async (articleId, articleData) => {
  try {
    const articleRef = doc(db, 'articles', articleId);
    
    await updateDoc(articleRef, {
      ...articleData,
      status: ARTICLE_STATUS.DRAFT,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

// ==========================================
// CHECK IF USER CAN PUBLISH
// ==========================================
export const canUserPublish = async (userId) => {
  try {
    // Get user profile from users collection
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { canPublish: false, reason: 'User profile not found' };
    }

    const userData = userSnap.data();

    // Check if user is verified
    if (!userData.verified) {
      return { 
        canPublish: false, 
        reason: 'Account not verified. Please complete verification first.' 
      };
    }

    // Check account type
    const allowedTypes = ['creator', 'journalist', 'organization'];
    if (!allowedTypes.includes(userData.accountType)) {
      return { 
        canPublish: false, 
        reason: 'Only creators, journalists, and organizations can publish articles.' 
      };
    }

    return { canPublish: true, reason: null };
  } catch (error) {
    console.error('Error checking publish permission:', error);
    return { canPublish: false, reason: 'Error checking permissions' };
  }
};