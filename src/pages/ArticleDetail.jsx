/*
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getArticle, incrementArticleViews, likeArticle, deleteArticle } from '../services/articleService';
import { formatDistanceToNow } from 'date-fns';
import { FaClock, FaUser, FaHeart, FaRegHeart, FaEye, FaShare, FaArrowLeft, FaEdit, FaExternalLinkAlt, FaTrash, FaComment } from 'react-icons/fa';
import SafeImage from '../components/common/SafeImage';
import toast from 'react-hot-toast';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const articleData = await getArticle(id);
      setArticle(articleData);
      setLikes(articleData.likes || 0);
      const user = auth.currentUser;
      if (user && articleData.likedBy) {
        setLiked(articleData.likedBy.includes(user.uid));
      }
      await incrementArticleViews(id);
      loadComments();
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Failed to load article');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to like articles');
        navigate('/auth');
        return;
      }
      const result = await likeArticle(id, user.uid);
      setLikes(result.likes);
      setLiked(result.liked);
      toast.success(result.liked ? '❤️ Liked!' : 'Like removed');
    } catch (error) {
      console.error('Error liking article:', error);
      toast.error('Failed to like article');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: article.title, text: article.summary || article.description, url: url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('📋 Link copied!');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteArticle(id);
      toast.success('🗑️ Article deleted!');
      navigate('/articles/my');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(error.message || 'Failed to delete');
      setDeleting(false);
    }
  };

  const canEdit = () => {
    const user = auth.currentUser;
    return user && article && article.authorId === user.uid;
  };

  const loadComments = async () => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('articleId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      toast.error('Please login to comment');
      navigate('/auth');
      return;
    }

    try {
      setSubmittingComment(true);
      await addDoc(collection(db, 'comments'), {
        articleId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email,
        comment: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
      toast.success('Comment posted!');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      toast.success('Comment deleted');
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-4">This article does not exist.</p>
          <button onClick={() => navigate('/')} className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90">Go Home</button>
        </div>
      </div>
    );
  }

  const timeAgo = article.publishedAt ? formatDistanceToNow(article.publishedAt.toDate ? article.publishedAt.toDate() : new Date(article.publishedAt), { addSuffix: true }) : 'Recently';

  return (
    <div className="min-h-screen bg-gray-50">
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Article?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-primary"><FaArrowLeft />Back</button>
            <div className="flex items-center gap-3">
              {canEdit() && (
                <React.Fragment>
                  <button onClick={() => navigate(`/articles/edit/${id}`)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><FaEdit />Edit</button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><FaTrash />Delete</button>
                </React.Fragment>
              )}
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"><FaShare />Share</button>
            </div>
          </div>
        </div>
      </div>
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
          <SafeImage article={article} alt={article.title} className="w-full h-96 object-cover" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <span className="px-4 py-2 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-semibold capitalize">{article.category}</span>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><FaClock />{timeAgo}</span>
            <span className="flex items-center gap-1"><FaEye />{article.views || 0}</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{article.title}</h1>
        <div className="flex items-center justify-between mb-8 pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">{(article.authorName || 'A').charAt(0).toUpperCase()}</div>
            <div>
              <p className="font-semibold text-gray-900">{article.authorName || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">{article.authorEmail || ''}</p>
            </div>
          </div>
          <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${liked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{liked ? <FaHeart /> : <FaRegHeart />}<span>{likes}</span></button>
        </div>
        {article.summary && (
          <div className="bg-blue-50 border-l-4 border-primary p-6 mb-8 rounded-r-lg">
            <p className="text-lg text-gray-700 italic">{article.summary}</p>
          </div>
        )}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{article.content}</div>
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">#{tag}</span>
              ))}
            </div>
          </div>
        )}
        {article.sources && article.sources.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources</h3>
            <div className="space-y-3">
              {article.sources.map((source, index) => (
                <a key={index} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-primary">{source.name}</p>
                    <p className="text-sm text-gray-500 truncate">{source.url}</p>
                  </div>
                  <FaExternalLinkAlt className="text-gray-400 group-hover:text-primary flex-shrink-0 ml-3" />
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FaComment className="text-primary" />
            Comments ({comments.length})
          </h3>
          
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
              rows="4"
              required
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="mt-3 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <div className="space-y-4">
            {comments.map((comment) => {
              const isCommentAuthor = auth.currentUser && comment.userId === auth.currentUser.uid;
              return (
                <div key={comment.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        {(comment.userName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{comment.userName}</p>
                        <p className="text-xs text-gray-500">
                          {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    {isCommentAuthor && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Delete comment"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              );
            })}
            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Enjoyed this article?</h3>
          <p className="mb-4 opacity-90">Share it with your friends!</p>
          <button onClick={handleShare} className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg">Share Article</button>
        </div>
      </article>
    </div>
  );
};

export default ArticleDetail;
*/

// E:\press-india\src\components\article\ArticleDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import articleService from "../../services/articleService"; // default instance (recommended)
import { formatDistanceToNow } from "date-fns";
import {
  FaClock,
  FaHeart,
  FaRegHeart,
  FaEye,
  FaShare,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaComment,
} from "react-icons/fa";
import SafeImage from "../common/SafeImage"; // keep if exists; otherwise replace with <img>
import toast from "react-hot-toast";

/* ---------- Helpers ---------- */

const safeToDate = (v) => {
  try {
    if (!v) return null;
    if (typeof v?.toDate === "function") return v.toDate();
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const formatTimeAgo = (v) => {
  const d = safeToDate(v);
  if (!d) return "Recently";
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return d.toLocaleString();
  }
};

/* ---------- Component ---------- */

const ArticleDetail = () => {
  const { id } = useParams(); // route param (id or slug)
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setLoading(true);
      setArticle(null);
      setLikes(0);
      setLiked(false);
      setComments([]);

      if (!id) {
        setLoading(false);
        return;
      }

      try {
        // get article (by id or slug)
        const a = await articleService.getArticleById(id).catch(() => null);

        if (!mounted) return;

        if (!a) {
          setArticle(null);
          setLoading(false);
          return;
        }

        // normalize fields to safe shapes
        const safe = {
          id: a.id || id,
          title: a.title || "Untitled",
          content: a.content || a.body || a.html || "",
          summary: a.summary || a.description || "",
          category: a.category || "general",
          authorId: a.authorId || a.userId || a.author || "",
          authorName: a.authorName || a.author || a.userName || "Anonymous",
          authorEmail: a.authorEmail || a.email || "",
          imageUrl: a.featuredImage || a.imageUrl || a.image || "",
          publishedAt: a.publishedAt || a.createdAt || null,
          views: typeof a.views === "number" ? a.views : Number(a.views) || 0,
          likes: typeof a.likes === "number" ? a.likes : Number(a.likes) || 0,
          likedBy: Array.isArray(a.likedBy) ? a.likedBy : [],
          tags: Array.isArray(a.tags) ? a.tags : [],
          raw: a.raw || a,
        };

        setArticle(safe);
        setLikes(safe.likes || 0);

        const user = auth.currentUser;
        if (user && Array.isArray(safe.likedBy)) {
          setLiked(safe.likedBy.includes(user.uid));
        } else {
          setLiked(false);
        }

        // increment views (fire-and-forget)
        articleService.incrementViews?.(safe.id).catch(() => {});
        // load comments for this article
        loadComments(safe.id);
      } catch (err) {
        console.error("Error loading article:", err);
        toast.error("Failed to load article");
        setArticle(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const loadComments = async (articleId) => {
      try {
        const q = query(
          collection(db, "comments"),
          where("articleId", "==", articleId),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        if (!mounted) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setComments(list);
      } catch (err) {
        console.error("Error loading comments:", err);
        setComments([]);
      }
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, [id]);

  const canEdit = useMemo(() => {
    const user = auth.currentUser;
    return !!(user && article && article.authorId === user.uid);
  }, [article]);

  const publishedDate = article ? (safeToDate(article.publishedAt) || safeToDate(article.createdAt)) : null;
  const timeAgo = publishedDate ? formatTimeAgo(article.publishedAt || article.createdAt) : "Recently";

  /* ---------- Actions ---------- */

  const handleLike = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please login to like articles");
      navigate("/auth");
      return;
    }
    if (!article) return;

    try {
      // articleService.likeArticle returns { likes, liked }
      const res = await articleService.likeArticle(article.id, user.uid);
      if (res && typeof res.likes === "number") setLikes(res.likes);
      if (res && typeof res.liked === "boolean") setLiked(res.liked);
      toast.success(res.liked ? "Liked" : "Unliked");
    } catch (err) {
      console.error("Like error", err);
      toast.error("Failed to update like");
    }
  };

  const handleShare = () => {
    if (!article) return;
    const url = window.location.href;
    const text = article.summary || article.title || "";
    if (navigator.share) {
      navigator.share({ title: article.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard"));
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!window.confirm("Delete this article permanently?")) return;
    try {
      setDeleting(true);
      await articleService.deleteArticle(article.id);
      toast.success("Article deleted");
      navigate("/articles/my");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete article");
    } finally {
      setDeleting(false);
    }
  };

  const submitComment = async (e) => {
    e && e.preventDefault();
    if (!newComment.trim()) return;
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please login to comment");
      navigate("/auth");
      return;
    }
    try {
      setPostingComment(true);
      await addDoc(collection(db, "comments"), {
        articleId: article.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        comment: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      toast.success("Comment posted");
      // reload comments
      const q = query(
        collection(db, "comments"),
        where("articleId", "==", article.id),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Comment post failed", err);
      toast.error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const deleteComment = async (commentId, commentUserId) => {
    // allow deletion by comment owner only
    const user = auth.currentUser;
    if (!user || user.uid !== commentUserId) return toast.error("Not authorized");
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "comments", commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      console.error("Delete comment failed", err);
      toast.error("Failed to delete comment");
    }
  };

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Article not found</h2>
          <p className="text-gray-600 mb-4">The article might have been removed or is unavailable.</p>
          <button onClick={() => navigate("/")} className="px-4 py-2 bg-primary text-white rounded-lg">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Delete this article?</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-lg bg-gray-100">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-lg bg-red-500 text-white">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600">
            <FaArrowLeft /> Back
          </button>

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button onClick={() => navigate(`/articles/edit/${article.id}`)} className="px-3 py-1 rounded bg-blue-600 text-white">
                  <FaEdit /> Edit
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1 rounded bg-red-500 text-white">
                  <FaTrash /> Delete
                </button>
              </>
            )}
            <button onClick={handleShare} className="px-3 py-1 rounded bg-gray-700 text-white">
              <FaShare /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Article content */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="rounded-xl overflow-hidden shadow mb-6">
          {article.imageUrl ? (
            <SafeImage src={article.imageUrl} alt={article.title} className="w-full h-96 object-cover" />
          ) : (
            <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 rounded-full bg-primary bg-opacity-10 text-primary text-sm">{article.category}</span>
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <span className="flex items-center gap-1"><FaClock /> {timeAgo}</span>
            <span className="flex items-center gap-1"><FaEye /> {article.views || 0}</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center justify-between mb-8 pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {(article.authorName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{article.authorName}</div>
              {article.authorEmail && <div className="text-sm text-gray-500">{article.authorEmail}</div>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleLike} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${liked ? "bg-red-500 text-white" : "bg-gray-100"}`}>
              {liked ? <FaHeart /> : <FaRegHeart />} <span>{typeof likes === "number" ? likes : 0}</span>
            </button>
            <button onClick={handleShare} className="px-3 py-2 rounded-lg bg-gray-100">
              <FaShare />
            </button>
          </div>
        </div>

        <div className="prose prose-lg max-w-none mb-12 text-gray-700 whitespace-pre-wrap">
          {/* render as HTML if content contains HTML, otherwise show text */}
          {article.content ? (
            typeof article.content === "string" && article.content.trim().startsWith("<") ? (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <div>{article.content}</div>
            )
          ) : (
            <div className="text-gray-500">No content</div>
          )}
        </div>

        {/* Tags */}
        <div className="mb-6">
          {article.tags && article.tags.length ? (
            <div className="flex gap-2 flex-wrap">
              {article.tags.map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-sm">{t}</span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaComment /> Comments ({comments.length})</h3>

          <form onSubmit={submitComment} className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 border rounded resize-none"
              rows={4}
            />
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={postingComment || !newComment.trim()} className="px-4 py-2 bg-primary text-white rounded">
                {postingComment ? "Posting..." : "Post Comment"}
              </button>
              <button type="button" onClick={() => setNewComment("")} className="px-4 py-2 border rounded">Clear</button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length ? comments.map((c) => (
              <div key={c.id} className="border-l-4 border-primary pl-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{c.userName || "Anonymous"}</div>
                    <div className="text-xs text-gray-500">
                      {c.createdAt && typeof c.createdAt.toDate === "function"
                        ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true })
                        : "Just now"}
                    </div>
                  </div>
                  {auth.currentUser?.uid === c.userId && (
                    <button onClick={() => deleteComment(c.id, c.userId)} className="text-red-500 text-sm">Delete</button>
                  )}
                </div>
                <div className="mt-2 text-gray-700">{c.comment}</div>
              </div>
            )) : (
              <div className="text-center text-gray-500">No comments yet — be the first to comment.</div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default ArticleDetail;


