// File: src/pages/MyArticles.jsx
/*
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { getUserArticles, deleteArticle } from '../services/articleService';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaHeart, 
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import SafeImage from '../components/common/SafeImage';
import toast from 'react-hot-toast';

const MyArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const userArticles = await getUserArticles(user.uid);
      setArticles(userArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    try {
      setDeleting(true);
      await deleteArticle(articleId);
      toast.success('🗑️ Article deleted successfully!');
      setDeleteConfirm(null);
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(error.message || 'Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_review: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };

    const labels = {
      draft: 'Draft',
      pending_review: 'Under Review',
      published: 'Published',
      rejected: 'Rejected'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status] || badges.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-500 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Article?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deleteConfirm.title}</strong>"? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Articles</h1>
            <p className="text-gray-600">Manage your published and draft articles</p>
          </div>
          
          <button
            onClick={() => navigate('/articles/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
          >
            <FaPlus />
            New Article
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Total Articles</p>
            <p className="text-3xl font-bold text-gray-900">{articles.length}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Published</p>
            <p className="text-3xl font-bold text-green-600">
              {articles.filter(a => a.status === 'published').length}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Drafts</p>
            <p className="text-3xl font-bold text-gray-600">
              {articles.filter(a => a.status === 'draft').length}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Under Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {articles.filter(a => a.status === 'pending_review').length}
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPlus className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
            <p className="text-gray-600 mb-6">Start writing your first article!</p>
            <button
              onClick={() => navigate('/articles/new')}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Create Article
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => {
              const timeAgo = article.createdAt 
                ? formatDistanceToNow(article.createdAt.toDate ? article.createdAt.toDate() : new Date(article.createdAt), { addSuffix: true })
                : 'Recently';

              return (
                <div
                  key={article.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-4 p-4">
                    <div 
                      className="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/articles/${article.id}`)}
                    >
                      <SafeImage
                        article={article}
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 
                            onClick={() => navigate(`/articles/${article.id}`)}
                            className="text-xl font-semibold text-gray-900 mb-1 hover:text-primary transition cursor-pointer line-clamp-2"
                          >
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <FaClock />
                              {timeAgo}
                            </span>
                            <span className="capitalize">{article.category}</span>
                          </div>
                        </div>
                        {getStatusBadge(article.status)}
                      </div>

                      {article.summary && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                          {article.summary}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaEye />
                            {article.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaHeart />
                            {article.likes || 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/articles/edit/${article.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                          >
                            <FaEdit />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => setDeleteConfirm(article)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyArticles;
*/

// E:\press-india\src\pages\MyArticles.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../config/firebase";
import {
  getUserArticles,
  deleteArticle as deleteArticleService,
  getArticleById,
  toggleStatus,
} from "../services/articleService";

/* ---------- Helpers ---------- */

const toDate = (value) => {
  if (!value) return null;
  try {
    // service returns ISO string for timestamps; accept Date, ISO string or Firestore Timestamp-like
    if (typeof value === "string") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") return value.toDate();
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const timeAgo = (value) => {
  const d = toDate(value);
  if (!d) return "Unknown";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return d.toLocaleDateString();
};

const statusMeta = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s === "published" || s === "approved") return { label: "Published", key: "published", className: "bg-green-100 text-green-800" };
  if (s === "pending" || s === "pending_review" || s === "submitted") return { label: "Pending Review", key: "pending", className: "bg-yellow-100 text-yellow-800" };
  if (s === "draft") return { label: "Draft", key: "draft", className: "bg-gray-100 text-gray-800" };
  if (s === "rejected") return { label: "Rejected", key: "rejected", className: "bg-red-100 text-red-800" };
  return { label: s || "Unknown", key: "unknown", className: "bg-gray-100 text-gray-800" };
};

/* ---------- Component ---------- */

const MyArticles = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // watch auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // check admin flag in users/{uid}
  useEffect(() => {
    let mounted = true;
    const checkAdmin = async () => {
      setIsAdmin(false);
      if (!user?.uid) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!mounted) return;
        const data = snap.exists() ? snap.data() : null;
        if (data && data.role && String(data.role).toLowerCase() === "admin") setIsAdmin(true);
        else setIsAdmin(false);
      } catch (err) {
        console.error("admin check error", err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
    return () => { mounted = false; };
  }, [user]);

  // load user articles
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (!user?.uid) {
          setArticles([]);
          setLoading(false);
          return;
        }
        const list = await getUserArticles(user.uid);
        if (!mounted) return;
        const normalized = Array.isArray(list) ? list.map((a) => ({
          id: a?.id || "",
          title: a?.title || "Untitled",
          slug: a?.slug || "",
          summary: a?.summary || a?.description || "",
          content: a?.content || "",
          tags: Array.isArray(a?.tags) ? a.tags : [],
          status: (a?.status || "draft").toLowerCase(),
          createdAt: a?.createdAt || a?.publishedAt || null,
          updatedAt: a?.updatedAt || null,
          views: typeof a?.views === "number" ? a.views : Number(a?.views) || 0,
          likes: typeof a?.likes === "number" ? a.likes : Number(a?.likes) || 0,
          featuredImage: a?.featuredImage || a?.imageUrl || "",
          raw: a,
        })) : [];
        setArticles(normalized);
      } catch (err) {
        console.error("Failed to load articles", err);
        toast.error("Could not load your articles.");
        setArticles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const refresh = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const list = await getUserArticles(user.uid);
      setArticles(Array.isArray(list) ? list.map((a) => ({
        id: a?.id || "",
        title: a?.title || "Untitled",
        slug: a?.slug || "",
        summary: a?.summary || a?.description || "",
        content: a?.content || "",
        tags: Array.isArray(a?.tags) ? a.tags : [],
        status: (a?.status || "draft").toLowerCase(),
        createdAt: a?.createdAt || a?.publishedAt || null,
        updatedAt: a?.updatedAt || null,
        views: typeof a?.views === "number" ? a.views : Number(a?.views) || 0,
        likes: typeof a?.likes === "number" ? a.likes : Number(a?.likes) || 0,
        featuredImage: a?.featuredImage || a?.imageUrl || "",
        raw: a,
      })) : []);
      toast.success("Refreshed");
    } catch (err) {
      console.error(err);
      toast.error("Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (a) => {
    if (!a?.id && !a?.slug) return toast.error("Invalid article");
    // your project routes may differ — this matches common pattern
    navigate(`/article/${a.id || a.slug}`);
  };

  const handleEdit = (a) => {
    if (!a?.id) return toast.error("Invalid article");
    navigate(`/articles/edit/${a.id}`);
  };

  const handleDeleteConfirm = (a) => {
    setDeleteConfirm(a);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    try {
      setBusyId(id);
      await deleteArticleService(id);
      toast.success("Article deleted");
      setArticles((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete article");
    } finally {
      setBusyId(null);
    }
  };

  const handleRefreshOne = async (a) => {
    if (!a?.id) return;
    try {
      setBusyId(a.id);
      const fresh = await getArticleById(a.id);
      if (!fresh) {
        toast.error("Article not found");
        return;
      }
      setArticles((prev) => prev.map((p) => ((p.id || p.slug) === (a.id || a.slug) ? {
        id: fresh.id || p.id,
        title: fresh.title || p.title,
        slug: fresh.slug || p.slug,
        summary: fresh.summary || p.summary,
        tags: Array.isArray(fresh.tags) ? fresh.tags : p.tags,
        status: (fresh.status || p.status || "draft").toLowerCase(),
        createdAt: fresh.createdAt || p.createdAt,
        updatedAt: fresh.updatedAt || p.updatedAt,
        views: typeof fresh.views === 'number' ? fresh.views : p.views,
        likes: typeof fresh.likes === 'number' ? fresh.likes : p.likes,
        featuredImage: fresh.featuredImage || p.featuredImage,
        raw: fresh.raw || p.raw,
      } : p)));
      toast.success("Article refreshed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh article");
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminTogglePublish = async (a) => {
    if (!isAdmin) return toast.error("Admin privileges required");
    if (!a?.id) return;
    try {
      setBusyId(a.id);
      await toggleStatus(a.id);
      toast.success("Status toggled (admin)");
      // refresh single item in UI
      await handleRefreshOne(a);
    } catch (err) {
      console.error("toggleStatus failed", err);
      toast.error("Failed to toggle status");
    } finally {
      setBusyId(null);
    }
  };

  const wasEdited = (createdAtRaw, updatedAtRaw) => {
    const c = toDate(createdAtRaw);
    const u = toDate(updatedAtRaw);
    if (!c || !u) return false;
    // edited if updated > created + 30s
    return u.getTime() - c.getTime() > 30 * 1000;
  };

  /* ---------- Render ---------- */

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "rgba(0,0,0,0.4)", zIndex: 60
        }}>
          <div style={{ width: 520, background: "#fff", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 12 }}>Delete article</h3>
            <p>Are you sure you want to permanently delete "<strong>{deleteConfirm.title}</strong>"? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#e5e7eb" }}>Cancel</button>
              <button onClick={handleDelete} disabled={busyId === deleteConfirm.id} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#ef4444", color: "#fff" }}>
                {busyId === deleteConfirm.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>My Articles</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/articles/new")} style={{ padding: "8px 12px", borderRadius: 6, background: "#1f2937", color: "#fff" }}>
            + New Article
          </button>
          <button onClick={refresh} style={{ padding: "8px 12px", borderRadius: 6 }}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24 }}>Loading your articles…</div>
      ) : articles.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center" }}>
          <p>You don't have any articles yet.</p>
          <button onClick={() => navigate("/articles/new")} style={{ padding: "8px 12px", borderRadius: 6, background: "#1f2937", color: "#fff" }}>
            Write your first article
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {articles.map((a) => {
            const status = statusMeta(a.status);
            const edited = wasEdited(a.createdAt, a.updatedAt);
            return (
              <div key={a.id || a.slug} style={{ display: "flex", gap: 12, padding: 14, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", alignItems: "stretch" }}>
                <div style={{ width: 140, height: 90, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {a.featuredImage ? (
                    <img src={a.featuredImage} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.src = "/placeholder.png"; }} />
                  ) : (
                    <div style={{ fontSize: 12, color: "#9ca3af", padding: 6, textAlign: "center" }}>No Image</div>
                  )}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ margin: 0 }}>{a.title}</h3>
                      {edited && <span style={{ marginLeft: 8, fontSize: 12, padding: "3px 8px", background: "#eef2ff", borderRadius: 8 }}>Edited</span>}
                      <span style={{ marginLeft: 12, fontSize: 12, color: "#374151", padding: "4px 8px", borderRadius: 8, background: status.className.split(" ")[0] === "bg-green-100" ? "#ecfdf5" : status.className.split(" ")[0] === "bg-yellow-100" ? "#fff7ed" : "#f3f4f6" }}>
                        {status.label}
                      </span>
                    </div>

                    <p style={{ margin: "8px 0", color: "#6b7280" }}>{a.summary || (a.content ? `${String(a.content).slice(0, 180)}${String(a.content).length > 180 ? "…" : ""}` : "")}</p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                      {a.tags && a.tags.length ? a.tags.map((t, i) => (
                        <span key={i} style={{ padding: "6px 10px", borderRadius: 999, background: edited ? "#fef3c7" : "#eef2ff", color: "#111827", fontSize: 13 }}>
                          {t}
                        </span>
                      )) : <span style={{ color: "#9ca3af", fontSize: 13 }}>No tags</span>}
                      {edited && <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>— tags may have been edited</span>}
                    </div>

                    <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                      <span>{timeAgo(a.createdAt)}</span>
                      <span style={{ margin: "0 8px" }}>•</span>
                      <span>{a.views ?? 0} views</span>
                      <span style={{ margin: "0 8px" }}>•</span>
                      <span>{a.likes ?? 0} likes</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => handleView(a)} style={{ padding: "8px 12px", borderRadius: 6 }}>
                      View
                    </button>

                    <button onClick={() => handleEdit(a)} style={{ padding: "8px 12px", borderRadius: 6, background: "#2563eb", color: "#fff" }}>
                      Edit
                    </button>

                    <button onClick={() => handleDeleteConfirm(a)} style={{ padding: "8px 12px", borderRadius: 6, background: "#ef4444", color: "#fff" }}>
                      Delete
                    </button>

                    <button onClick={() => handleRefreshOne(a)} disabled={busyId === a.id} style={{ padding: "8px 12px", borderRadius: 6 }}>
                      {busyId === a.id ? "Refreshing..." : "Refresh"}
                    </button>

                    {isAdmin && (
                      <button onClick={() => handleAdminTogglePublish(a)} disabled={busyId === a.id} style={{ padding: "8px 12px", borderRadius: 6, background: "#059669", color: "#fff", marginLeft: "auto" }}>
                        {busyId === a.id ? "Working..." : "Admin Toggle Publish"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyArticles;




