/*
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

// IMPORTANT: use the DEFAULT export instance to avoid the named-export error
// (articleService exposes incrementArticleViews on the class instance,
// but your service file does NOT export a named `incrementArticleViews` function)
import articleService from '/src/services/articleService';

function formatDateSafe(value) {
  try {
    if (!value) return '';
    // Firestore Timestamp -> Date
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    // ISO string or epoch
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return '';
  }
}

function normalizeHtml(html) {
  if (!html) return '';
  return String(html);
}

const ArticleDetail = ({ articleId: propArticleId }) => {
  const params = useParams();
  const articleId = useMemo(() => propArticleId || params.articleId || params.id, [propArticleId, params]);

  const [article, setArticle] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    if (!articleId) {
      setState({ loading: false, error: 'Article ID is missing.' });
      return () => { cancelled = true; };
    }

    // Fetch article details
    (async () => {
      setState({ loading: true, error: null });
      try {
        const data = await articleService.getArticleById(articleId);
        if (!cancelled) {
          setArticle(data || null);
          setState({ loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err?.message || 'Failed to load the article.',
          });
        }
      }
    })();

    // Increment views (fire-and-forget, non-blocking, errors swallowed in service)
    // This calls the instance method that exists on your service.
    (async () => {
      try {
        await articleService.incrementArticleViews(articleId);
      } catch {
        // Intentionally ignore — not critical for UX
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (state.loading) {
    return (
      <section className="article-detail loading" aria-busy="true" aria-live="polite">
        <div style={{ padding: '16px' }}>
          <h2 style={{ margin: 0 }}>Loading article…</h2>
          <p>Please wait.</p>
        </div>
      </section>
    );
  }

  if (state.error) {
    return (
      <section className="article-detail error" role="alert">
        <div style={{ padding: '16px' }}>
          <h2 style={{ marginTop: 0 }}>Unable to load article</h2>
          <p style={{ color: '#b00020' }}>{state.error}</p>
        </div>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="article-detail empty">
        <div style={{ padding: '16px' }}>
          <h2 style={{ marginTop: 0 }}>Article not found</h2>
          <p>The article might have been removed or is unavailable.</p>
        </div>
      </section>
    );
  }

  const {
    title,
    description,
    content,
    author,
    source,
    category,
    createdAt,
    publishedAt,
    views,
    likes,
    imageUrl,
  } = article;

  return (
    <article className="article-detail" itemScope itemType="https://schema.org/NewsArticle">
      {imageUrl ? (
        <div className="article-hero" style={{ width: '100%', maxHeight: 420, overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt={title || 'Article image'}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      <header style={{ padding: '16px' }}>
        <h1 itemProp="headline" style={{ marginTop: 0 }}>{title || 'Untitled'}</h1>

        <div
          className="article-meta"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: '#666', fontSize: 14 }}
        >
          {author ? <span itemProp="author">{author}</span> : null}
          {source ? <span>• {source}</span> : null}
          {category ? <span>• {String(category).toUpperCase()}</span> : null}
          <span>• {formatDateSafe(publishedAt || createdAt)}</span>
          {Number.isFinite?.(views) || typeof views === 'number' ? <span>• {views} views</span> : null}
          {Number.isFinite?.(likes) || typeof likes === 'number' ? <span>• {likes} likes</span> : null}
        </div>

        {description ? (
          <p style={{ marginTop: 8, color: '#333' }} itemProp="description">
            {description}
          </p>
        ) : null}
      </header>

      <section className="article-content" style={{ padding: '16px', lineHeight: 1.7 }}>
        <div
          itemProp="articleBody"
          // Render trusted HTML; if untrusted, convert to text or sanitize with a vetted library.
          dangerouslySetInnerHTML={{ __html: normalizeHtml(content) }}
        />
      </section>
    </article>
  );
};

ArticleDetail.propTypes = {
  articleId: PropTypes.string,
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
