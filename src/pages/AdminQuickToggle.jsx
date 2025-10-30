// E:\press-india\src\pages\AdminQuickToggle.jsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getPendingArticles,
  approveArticle,
  updateArticle,
  getArticleById,
} from "../services/articleService"; // updateArticle exists in the service
import { useNavigate } from "react-router-dom";

/**
 * AdminQuickToggle
 * - Shows pending articles
 * - Approve (publish) or Toggle status (published <-> pending)
 * - Posts BroadcastChannel message on publish/toggle to notify Explore page
 */
const AdminQuickToggle = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const list = await getPendingArticles();
        if (!mounted) return;
        setArticles(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load pending articles", err);
        toast.error("Failed to load pending articles");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const notifyAllTabs = (msg) => {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("press-india");
        bc.postMessage(msg);
        bc.close();
      } else if (typeof window !== "undefined") {
        // fallback: simple localStorage ping (other tabs can listen)
        try {
          localStorage.setItem("press-india:msg", JSON.stringify({ ...msg, t: Date.now() }));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn("BroadcastChannel notify failed", err);
    }
  };

  const handleApprove = async (articleId) => {
    if (!articleId) return;
    setBusyId(articleId);
    try {
      await approveArticle(articleId); // service sets status:'published'
      toast.success("Article approved & published");
      // notify other tabs (Explore) to refresh
      notifyAllTabs({ type: "article-approved", articleId });
      // remove from local list (it is no longer pending)
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch (err) {
      console.error("Approve failed", err);
      toast.error("Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Toggle status between 'published' and 'pending'
   * Uses updateArticle (available in articleService) so no extra export is required.
   */
  const handleToggle = async (articleId) => {
    if (!articleId) return;
    setBusyId(articleId);
    try {
      // fetch current article to know current status (best-effort)
      const current = await getArticleById(articleId).catch(() => null);
      const currentStatus = (current && current.status) ? String(current.status).toLowerCase() : "pending";

      const newStatus = currentStatus === "published" || currentStatus === "approved" ? "pending" : "published";

      // updateArticle expects (id, updates)
      await updateArticle(articleId, { status: newStatus });

      toast.success(`Status toggled → ${newStatus}`);
      // notify other tabs (Explore)
      notifyAllTabs({ type: "article-updated", articleId, status: newStatus });

      // refresh local list to reflect new status; if published remove from pending list
      setArticles((prev) =>
        prev
          .map((a) => (a.id === articleId ? { ...a, status: newStatus } : a))
          .filter((a) => (newStatus === "published" ? a.id !== articleId : true))
      );
    } catch (err) {
      console.error("Toggle failed", err);
      toast.error("Failed to toggle status");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading pending articles…</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Admin Quick Toggle</h2>
        <button onClick={() => navigate("/admin/articles")} className="px-3 py-2 rounded bg-gray-200">
          Open Admin Articles
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="text-gray-600">No pending articles found.</div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.id} className="p-3 bg-white rounded shadow flex items-center justify-between">
              <div>
                <div className="font-semibold">{a.title || "Untitled"}</div>
                <div className="text-sm text-gray-500">By {a.authorName || a.authorId || "—"}</div>
                <div className="text-xs text-gray-400 mt-1">Status: {a.status || "pending"}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(a.id)}
                  disabled={busyId === a.id}
                  className="px-3 py-2 rounded bg-green-600 text-white"
                >
                  {busyId === a.id ? "Working…" : "Approve & Publish"}
                </button>

                <button
                  onClick={() => handleToggle(a.id)}
                  disabled={busyId === a.id}
                  className="px-3 py-2 rounded bg-yellow-500 text-white"
                >
                  {busyId === a.id ? "Working…" : "Toggle Status"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminQuickToggle;
