/* 
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

class ArticleService {
  constructor() {
    this.articlesCollection = 'articles';
    console.log('📝 Article Service initialized');
  }


  async createArticle(articleData, userId) {
    try {
      const user = auth.currentUser;
      const actualUserId = userId || user?.uid;
      
      if (!actualUserId) {
        throw new Error('User must be logged in to create articles');
      }

      const article = {
        ...articleData,
        userId: actualUserId,
        authorId: actualUserId,
        authorName: user?.displayName || 'Anonymous',
        authorEmail: user?.email || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        views: 0,
        likes: 0,
        likedBy: []
      };

      const docRef = await addDoc(collection(db, this.articlesCollection), article);
      console.log('✅ Article created:', docRef.id);
      
      return {
        id: docRef.id,
        ...article
      };
    } catch (error) {
      console.error('❌ Error creating article:', error);
      throw error;
    }
  }

  async getPublishedArticles(category = 'all', maxResults = 50) {
    try {
      let q;

      if (category === 'all') {
        q = query(
          collection(db, this.articlesCollection),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
      } else {
        q = query(
          collection(db, this.articlesCollection),
          where('status', '==', 'approved'),
          where('category', '==', category),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
      }

      const querySnapshot = await getDocs(q);
      const articles = [];

      querySnapshot.forEach((document) => {
        const data = document.data();
        
        // Normalize source to always be a string
        let sourceName = 'Press India';
        if (data.source) {
          if (typeof data.source === 'string') {
            sourceName = data.source;
          } else if (typeof data.source === 'object' && data.source.name) {
            sourceName = data.source.name;
          }
        }
        
        articles.push({
          id: document.id,
          ...data,
          type: 'user',
          source: sourceName,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          publishedAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });

      console.log(`📰 Fetched ${articles.length} published articles`);
      return articles;

    } catch (error) {
      // Check if it's an index building error
      if (error.message?.includes('index') && error.message?.includes('building')) {
        console.warn('⏳ Firebase index is building, returning empty array temporarily');
        return [];
      }
      console.error('❌ Error fetching published articles:', error);
      return [];
    }
  }


  async getUserArticles(userId) {
    return this.getArticlesByUser(userId);
  }


  async getArticlesByUser(userId) {
    try {
      const q = query(
        collection(db, this.articlesCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const articles = [];

      querySnapshot.forEach((document) => {
        articles.push({
          id: document.id,
          ...document.data()
        });
      });

      return articles;
    } catch (error) {
      console.error('❌ Error fetching user articles:', error);
      throw error;
    }
  }

  async getArticle(articleId) {
    return this.getArticleById(articleId);
  }

  async getArticleById(articleId) {
    try {
      const docRef = doc(db, this.articlesCollection, articleId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Article not found');
      }
    } catch (error) {
      console.error('❌ Error fetching article:', error);
      throw error;
    }
  }

  async updateArticle(articleId, updates) {
    try {
      const docRef = doc(db, this.articlesCollection, articleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Article updated:', articleId);
      return true;
    } catch (error) {
      console.error('❌ Error updating article:', error);
      throw error;
    }
  }


  async deleteArticle(articleId) {
    try {
      const docRef = doc(db, this.articlesCollection, articleId);
      await deleteDoc(docRef);

      console.log('✅ Article deleted:', articleId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting article:', error);
      throw error;
    }
  }

  async approveArticle(articleId) {
    try {
      await this.updateArticle(articleId, {
        status: 'approved'
      });
      console.log('✅ Article approved:', articleId);
      return true;
    } catch (error) {
      console.error('❌ Error approving article:', error);
      throw error;
    }
  }


  async rejectArticle(articleId, reason = '') {
    try {
      await this.updateArticle(articleId, {
        status: 'rejected',
        rejectionReason: reason
      });
      console.log('✅ Article rejected:', articleId);
      return true;
    } catch (error) {
      console.error('❌ Error rejecting article:', error);
      throw error;
    }
  }

  async incrementArticleViews(articleId) {
    return this.incrementViews(articleId);
  }


  async incrementViews(articleId) {
    try {
      const user = auth.currentUser;
      if (!user) return; // Skip if not authenticated
      
      const docRef = doc(db, this.articlesCollection, articleId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentViews = docSnap.data().views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1
        });
      }
    } catch (error) {
      console.error('❌ Error incrementing views:', error);
      // Don't throw - this is not critical
    }
  }


  async searchArticles(searchQuery) {
    try {
      // Note: This is a basic search. For production, use Algolia or similar
      const q = query(
        collection(db, this.articlesCollection),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const articles = [];

      querySnapshot.forEach((document) => {
        const data = document.data();
        const searchLower = searchQuery.toLowerCase();
        
        // Simple text search in title and description
        if (
          data.title?.toLowerCase().includes(searchLower) ||
          data.description?.toLowerCase().includes(searchLower) ||
          data.content?.toLowerCase().includes(searchLower)
        ) {
          articles.push({
            id: document.id,
            ...data
          });
        }
      });

      return articles;
    } catch (error) {
      console.error('❌ Error searching articles:', error);
      return [];
    }
  }

  async getTrendingArticles(limitCount = 10) {
    try {
      const q = query(
        collection(db, this.articlesCollection),
        where('status', '==', 'approved'),
        orderBy('views', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const articles = [];

      querySnapshot.forEach((document) => {
        articles.push({
          id: document.id,
          ...document.data()
        });
      });

      return articles;
    } catch (error) {
      console.error('❌ Error fetching trending articles:', error);
      return [];
    }
  }

  async getPendingArticles() {
    try {
      const q = query(
        collection(db, this.articlesCollection),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const articles = [];

      querySnapshot.forEach((document) => {
        articles.push({
          id: document.id,
          ...document.data()
        });
      });

      return articles;
    } catch (error) {
      console.error('❌ Error fetching pending articles:', error);
      return [];
    }
  }
}

// Create singleton instance
const articleService = new ArticleService();

// Export as default (IMPORTANT for imports to work!)
export default articleService;

// Named exports for specific functions (for compatibility)
export const getUserArticles = (userId) => articleService.getUserArticles(userId);
export const getArticlesByUser = (userId) => articleService.getArticlesByUser(userId);
export const createArticle = (articleData, userId) => articleService.createArticle(articleData, userId);
export const getPublishedArticles = (category, maxResults) => articleService.getPublishedArticles(category, maxResults);
export const updateArticle = (articleId, updates) => articleService.updateArticle(articleId, updates);
export const deleteArticle = (articleId) => articleService.deleteArticle(articleId);
export const approveArticle = (articleId) => articleService.approveArticle(articleId);
export const rejectArticle = (articleId, reason) => articleService.rejectArticle(articleId, reason);
export const searchArticles = (query) => articleService.searchArticles(query);
export const getTrendingArticles = (limitCount) => articleService.getTrendingArticles(limitCount);
export const getPendingArticles = () => articleService.getPendingArticles();
export const incrementViews = (articleId) => articleService.incrementViews(articleId);
export const incrementArticleViews = (articleId) => articleService.incrementArticleViews(articleId);
export const getArticleById = (articleId) => articleService.getArticleById(articleId);
export const getArticle = (articleId) => articleService.getArticle(articleId);

// Like article function
export const likeArticle = async (articleId, userId) => {
  try {
    const docRef = doc(db, 'articles', articleId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const likedBy = data.likedBy || [];
      const liked = likedBy.includes(userId);
      
      if (liked) {
        await updateDoc(docRef, {
          likes: (data.likes || 0) - 1,
          likedBy: likedBy.filter(id => id !== userId)
        });
        return { likes: (data.likes || 0) - 1, liked: false };
      } else {
        await updateDoc(docRef, {
          likes: (data.likes || 0) + 1,
          likedBy: [...likedBy, userId]
        });
        return { likes: (data.likes || 0) + 1, liked: true };
      }
    }
    throw new Error('Article not found');
  } catch (error) {
    console.error('Error liking article:', error);
    throw error;
  }
};

// Additional named exports for ArticleEditor compatibility
export const submitArticleForPublication = async (articleId) => {
  // Submit article for publication/review
  try {
    await articleService.updateArticle(articleId, {
      status: 'pending',
      submittedAt: new Date().toISOString()
    });
    return { 
      published: false, 
      needsReview: true,
      message: 'Article submitted for review'
    };
  } catch (error) {
    console.error('Error submitting article:', error);
    throw error;
  }
};

// Article categories constant
export const ARTICLE_CATEGORIES = [
  'general',
  'india',
  'world',
  'business',
  'technology',
  'entertainment',
  'sports',
  'science',
  'health'
];
*/

// E:\press-india\src\services\articleService.js
/**
 * Production-ready Article Service
 * - Returns normalized article objects/arrays
 * - getArticleById returns null when not found (prevents console spam)
 * - Exposes both named exports and a default object for compatibility
 * - Broadcasts updates to "article_updates" channel when appropriate
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import errorHandler from "../utils/errorHandler";

const ARTICLES_COL = "articles";
const articlesRef = collection(db, ARTICLES_COL);

/** Helper: normalize Firestore doc -> consistent object */
function normalizeArticle(docSnap) {
  if (!docSnap || !docSnap.exists()) return null;
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    title: data.title || "",
    summary: data.summary || data.description || "",
    content: data.content || data.body || "",
    category: data.category || "general",
    tags: Array.isArray(data.tags) ? data.tags : [],
    featuredImage: data.featuredImage || data.imageUrl || data.urlToImage || null,
    authorId: data.authorId || data.userId || null,
    authorName: data.authorName || data.author || "Anonymous",
    status: data.status || "pending",
    slug: data.slug || "",
    likes: Number(data.likes || 0),
    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
    views: Number(data.views || 0),
    edited: !!data.edited,
    createdAt: data.createdAt || data.publishedAt || null,
    updatedAt: data.updatedAt || null,
    raw: data, // expose raw for advanced usage
  };
}

/** Broadcast helper */
function broadcastMessage(payload) {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("article_updates");
      bc.postMessage(payload);
      bc.close();
    } else if (typeof window !== "undefined") {
      // fallback simple localStorage ping
      try {
        localStorage.setItem("press-india:article_updates", JSON.stringify({ ...payload, t: Date.now() }));
      } catch {
        // Ignore localStorage errors
      }
    }
  } catch (err) {
    // never throw from broadcaster
    console.warn("broadcastMessage error:", err);
  }
}

/** Create article */
export async function createArticle(articleData = {}, userId) {
  try {
    if (!userId) throw new Error("createArticle requires userId");
    const payload = {
      ...articleData,
      userId,
      authorId: articleData.authorId || userId,
      authorName: articleData.authorName || articleData.author || "Anonymous",
      status: articleData.status || "pending",
      likes: Number(articleData.likes || 0),
      likedBy: Array.isArray(articleData.likedBy) ? articleData.likedBy : [],
      views: Number(articleData.views || 0),
      edited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(articlesRef, payload);
    const created = { id: docRef.id, ...payload };
    // broadcast new article (so admin flows or Explore can pick up)
    broadcastMessage({ type: "ARTICLE_CREATED", articleId: docRef.id });
    return created;
  } catch (err) {
    const msg = errorHandler.handle(err, "createArticle");
    throw new Error(msg);
  }
}

/** Update article */
export async function updateArticle(articleId, updates = {}) {
  try {
    if (!articleId) throw new Error("updateArticle requires articleId");
    const ref = doc(db, ARTICLES_COL, articleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Article not found");

    const payload = {
      ...updates,
      edited: true,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(ref, payload);

    broadcastMessage({ type: "ARTICLE_UPDATED", articleId });
    return { id: articleId, ...payload };
  } catch (err) {
    const msg = errorHandler.handle(err, "updateArticle");
    throw new Error(msg);
  }
}

/**
 * Get article by document ID OR slug.
 * IMPORTANT: returns `null` if not found (does NOT throw) — avoids console spam.
 */
export async function getArticleById(identifier) {
  try {
    if (!identifier) return null;

    // Try direct document ID
    const docRef = doc(db, ARTICLES_COL, identifier);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return normalizeArticle(docSnap);

    // Fallback: search by slug
    const slugQ = query(articlesRef, where("slug", "==", identifier), limit(1));
    const slugSnap = await getDocs(slugQ);
    if (!slugSnap.empty) return normalizeArticle(slugSnap.docs[0]);

    // Not found -> return null (no throw)
    return null;
  } catch (err) {
    // Log but return null to avoid repeated console errors across pages
    errorHandler.handle(err, "getArticleById");
    return null;
  }
}

/** Get published/approved articles (for Explore/home) */
export async function getPublishedArticles(limitCount = 50, category = null) {
  try {
    // Query supports both 'published' and legacy 'approved' statuses
    let q;
    if (category && category !== "all") {
      q = query(
        articlesRef,
        where("status", "in", ["published", "approved"]),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        articlesRef,
        where("status", "in", ["published", "approved"]),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(normalizeArticle).filter(Boolean);
  } catch (err) {
    // If Firestore index building or other recoverable issue, return empty array
    errorHandler.handle(err, "getPublishedArticles");
    return [];
  }
}

/** Get articles authored by a user */
export async function getUserArticles(userId) {
  try {
    if (!userId) return [];
    const q = query(articlesRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(normalizeArticle).filter(Boolean);
  } catch (err) {
    errorHandler.handle(err, "getUserArticles");
    return [];
  }
}

/** Approve article (mark published) */
export async function approveArticle(articleId) {
  try {
    if (!articleId) throw new Error("approveArticle requires articleId");
    const ref = doc(db, ARTICLES_COL, articleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Article not found");

    await updateDoc(ref, { status: "published", updatedAt: serverTimestamp() });
    broadcastMessage({ type: "ARTICLE_PUBLISHED", articleId });
    return true;
  } catch (err) {
    const msg = errorHandler.handle(err, "approveArticle");
    throw new Error(msg);
  }
}

/** Toggle status published <-> pending (admin or owner flows) */
export async function toggleStatus(articleId) {
  try {
    if (!articleId) throw new Error("toggleStatus requires articleId");
    const ref = doc(db, ARTICLES_COL, articleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Article not found");
    const current = snap.data() || {};
    const newStatus = current.status === "published" || current.status === "approved" ? "pending" : "published";

    await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp(), edited: true });
    broadcastMessage({ type: "ARTICLE_UPDATED", articleId, newStatus });
    return { id: articleId, newStatus };
  } catch (err) {
    const msg = errorHandler.handle(err, "toggleStatus");
    throw new Error(msg);
  }
}

/** Delete article */
export async function deleteArticle(articleId) {
  try {
    if (!articleId) throw new Error("deleteArticle requires articleId");
    await deleteDoc(doc(db, ARTICLES_COL, articleId));
    broadcastMessage({ type: "ARTICLE_DELETED", articleId });
    return true;
  } catch (err) {
    const msg = errorHandler.handle(err, "deleteArticle");
    throw new Error(msg);
  }
}

/** Get pending (for admin moderation) */
export async function getPendingArticles(limitCount = 50) {
  try {
    const q = query(
      articlesRef,
      where("status", "in", ["pending", "review", "pending_review"]),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(normalizeArticle).filter(Boolean);
  } catch (err) {
    errorHandler.handle(err, "getPendingArticles");
    return [];
  }
}

/** Increment views safely (silent failures) */
export async function incrementArticleViews(articleId) {
  try {
    if (!articleId) return;
    const ref = doc(db, ARTICLES_COL, articleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() || {};
    const views = Number(current.views || 0) + 1;
    await updateDoc(ref, { views });
    // Optionally broadcast minor update
    // broadcastMessage({ type: "ARTICLE_VIEWED", articleId, views });
  } catch (err) {
    // don't throw — view counting is non-critical
    errorHandler.handle(err, "incrementArticleViews");
  }
}

/**
 * Like/unlike with likedBy array support.
 * - If likedBy exists, toggles membership.
 * - Returns { likes: number, liked: boolean }
 */
export async function likeArticle(articleId, userId) {
  try {
    if (!articleId || !userId) throw new Error("likeArticle requires articleId and userId");
    const ref = doc(db, ARTICLES_COL, articleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Article not found");
    const data = snap.data() || {};
    const likedBy = Array.isArray(data.likedBy) ? data.likedBy.slice() : [];
    const already = likedBy.includes(userId);

    let newLikes;
    let newLikedBy;
    if (already) {
      // Unlike
      newLikedBy = likedBy.filter((id) => id !== userId);
      newLikes = Math.max(Number(data.likes || 0) - 1, 0);
    } else {
      // Like
      newLikedBy = [...likedBy, userId];
      newLikes = Number(data.likes || 0) + 1;
    }

    await updateDoc(ref, { likes: newLikes, likedBy: newLikedBy });
    broadcastMessage({ type: "ARTICLE_LIKED", articleId, likes: newLikes });

    return { likes: newLikes, liked: !already };
  } catch (err) {
    const msg = errorHandler.handle(err, "likeArticle");
    throw new Error(msg);
  }
}

/** Alias kept for backward compatibility */
export const toggleLikeArticle = async (articleId, userId, like = true) => {
  // This helper maps to likeArticle; if like === true ensure the user is present in likedBy
  try {
    if (!articleId || !userId) throw new Error("toggleLikeArticle requires articleId and userId");
    const ref = doc(db, ARTICLES_COL, articleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Article not found");
    const data = snap.data() || {};
    const likedBy = Array.isArray(data.likedBy) ? data.likedBy.slice() : [];
    const currently = likedBy.includes(userId);

    if (like && !currently) {
      return await likeArticle(articleId, userId);
    }
    if (!like && currently) {
      return await likeArticle(articleId, userId); // likeArticle toggles, so calling it will unlike
    }
    // no-op: return current counts
    return { likes: Number(data.likes || 0), liked: currently };
  } catch (err) {
    const msg = errorHandler.handle(err, "toggleLikeArticle");
    throw new Error(msg);
  }
};

/** Search (simple, client-side filter) */
export async function searchArticles(keyword, maxResults = 50) {
  try {
    if (!keyword || !keyword.trim()) return [];
    const low = keyword.trim().toLowerCase();

    // Fetch a reasonable sample of published articles and filter in memory
    const all = await getPublishedArticles(maxResults);
    return all.filter((a) => {
      const title = (a.title || "").toLowerCase();
      const summary = (a.summary || "").toLowerCase();
      const content = (a.content || "").toLowerCase();
      const tags = Array.isArray(a.tags) ? a.tags.join(" ").toLowerCase() : "";
      return title.includes(low) || summary.includes(low) || content.includes(low) || tags.includes(low);
    });
  } catch (err) {
    errorHandler.handle(err, "searchArticles");
    return [];
  }
}

/** Trending: sort by views desc then likes desc (simple heuristic) */
export async function getTrendingArticles(limitCount = 10) {
  try {
    // Try fast query by views if index exists
    try {
      const q = query(articlesRef, where("status", "in", ["published", "approved"]), orderBy("views", "desc"), limit(limitCount));
      const snap = await getDocs(q);
      const list = snap.docs.map(normalizeArticle).filter(Boolean);
      if (list.length) return list;
    } catch (qn) {
      // fallback to client-side score calculation
      errorHandler.handle(qn, "getTrendingArticles.queryFallback");
    }

    // Fallback: getPublishedArticles and score by views+likes
    const all = await getPublishedArticles(200);
    const scored = all
      .map((a) => ({ score: (Number(a.views || 0) * 1) + (Number(a.likes || 0) * 3), article: a }))
      .sort((x, y) => y.score - x.score)
      .slice(0, limitCount)
      .map((s) => s.article);

    return scored;
  } catch (err) {
    errorHandler.handle(err, "getTrendingArticles");
    return [];
  }
}

/** Export default object and named exports (compat) */
const defaultExport = {
  createArticle,
  updateArticle,
  getArticleById,
  getPublishedArticles,
  getUserArticles,
  approveArticle,
  deleteArticle,
  getPendingArticles,
  searchArticles,
  incrementArticleViews,
  likeArticle,
  toggleLikeArticle,
  toggleStatus,
  getTrendingArticles,
  normalizeArticle,
};

export default defaultExport;


