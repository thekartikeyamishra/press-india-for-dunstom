// E:\press-india\src\pages\Explore.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { FaFire, FaNewspaper, FaUser, FaClock, FaImage as FaImageIcon } from "react-icons/fa";
import NewsCard from "../components/news/NewsCard";
import { getPublishedArticles } from "../services/articleService"; // expected service
import { getGoogleNews } from "../services/newsService";
import toast from "react-hot-toast";

const CATEGORIES = [
  { id: "all", name: "All", icon: "📰", color: "bg-blue-500" },
  { id: "india", name: "India", icon: "🇮🇳", color: "bg-orange-500" },
  { id: "world", name: "World", icon: "🌍", color: "bg-green-500" },
  { id: "business", name: "Business", icon: "💼", color: "bg-purple-500" },
  { id: "technology", name: "Technology", icon: "💻", color: "bg-blue-600" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "bg-pink-500" },
  { id: "sports", name: "Sports", icon: "⚽", color: "bg-red-500" },
  { id: "science", name: "Science", icon: "🔬", color: "bg-teal-500" },
  { id: "health", name: "Health", icon: "🏥", color: "bg-green-600" },
];

// Safely obtain a Date from various possible fields (Firestore Timestamp, ISO string, number)
const safeDateVal = (a) => {
  if (!a) return null;
  const picks = [a.publishedAt, a.createdAt, a.updatedAt, a.published_at, a.date];
  for (const p of picks) {
    if (!p) continue;
    try {
      // Firestore Timestamp (has toDate or seconds)
      if (typeof p === "object" && p !== null) {
        if (typeof p.toDate === "function") {
          return p.toDate();
        }
        if (typeof p.seconds === "number") {
          return new Date(p.seconds * 1000);
        }
      }
      // numeric epoch (ms or s)
      if (typeof p === "number") {
        // if p looks like seconds (10 digits) treat as seconds
        return p > 1e12 ? new Date(p) : new Date(p * 1000);
      }
      const d = new Date(p);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {
      // ignore and try next
    }
  }
  return null;
};

const sortByNewest = (arr) =>
  arr.slice().sort((a, b) => {
    const da = safeDateVal(a) || new Date(0);
    const db = safeDateVal(b) || new Date(0);
    return db - da;
  });

/**
 * Local trending helper:
 * - fetch published articles
 * - sort by (likes + views) as a simple trending heuristic
 */
async function getTrendingArticlesLocal(limit = 20) {
  try {
    // try to get a larger pool then pick top-scoring
    const all = (await getPublishedArticles(limit * 3)) || [];
    const scored = all.map((a) => {
      const likes = Number(a.likes || 0);
      const views = Number(a.views || 0);
      const score = likes * 3 + views;
      return { score, article: a };
    });
    scored.sort((x, y) => y.score - x.score);
    return scored.slice(0, limit).map((s) => s.article);
  } catch (err) {
    console.error("getTrendingArticlesLocal error:", err);
    // fallback to empty array so UI doesn't break
    return [];
  }
}

const Explore = () => {
  const [activeTab, setActiveTab] = useState("trending");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const bcRefs = useRef([]);
  const pollRef = useRef(null);
  const mountedRef = useRef(true);

  const safeGetPublished = async (limit = 50) => {
    // Wrap call to handle different service shapes or failures
    try {
      if (typeof getPublishedArticles === "function") {
        const res = await getPublishedArticles(limit);
        return Array.isArray(res) ? res : [];
      }
      // fallback: try dynamic import (in case service was refactored)
      try {
        const svc = await import("../services/articleService");
        if (typeof svc.getPublishedArticles === "function") {
          const res2 = await svc.getPublishedArticles(limit);
          return Array.isArray(res2) ? res2 : [];
        }
      } catch (e) {
        // ignore dynamic import error
      }
      return [];
    } catch (err) {
      console.error("safeGetPublished error:", err);
      return [];
    }
  };

  const loadContent = useCallback(
    async (showToast = true) => {
      setLoading(true);
      try {
        let results = [];

        if (activeTab === "trending") {
          const trending = await getTrendingArticlesLocal(20);
          results = (Array.isArray(trending) ? trending : []).map((a) => ({ ...a, type: "user" }));
        } else if (activeTab === "recent") {
          // fetch published user articles + google news in parallel
          const [userArticles, newsArticles] = await Promise.allSettled([
            safeGetPublished(50),
            getGoogleNews(selectedCategory === "all" ? "general" : selectedCategory).catch((e) => {
              console.error("getGoogleNews error", e);
              return [];
            }),
          ]);

          const ua = Array.isArray(userArticles?.value || userArticles) ? (userArticles.value || userArticles) : [];
          const na = Array.isArray(newsArticles?.value || newsArticles) ? (newsArticles.value || newsArticles) : [];

          const uaMapped = ua.map((a) => ({ ...a, type: "user" }));
          const naMapped = na.slice(0, 10).map((a) => ({ ...a, type: "google" }));

          results = [...uaMapped, ...naMapped];
          results = sortByNewest(results);
        } else if (activeTab === "news") {
          const newsArticles = await getGoogleNews(selectedCategory === "all" ? "general" : selectedCategory).catch((e) => {
            console.error("getGoogleNews error", e);
            return [];
          });
          results = (Array.isArray(newsArticles) ? newsArticles : []).map((a) => ({ ...a, type: "google" }));
          results = sortByNewest(results);
        } else if (activeTab === "articles") {
          const userArticles = await safeGetPublished(50);
          results = (Array.isArray(userArticles) ? userArticles : []).map((a) => ({ ...a, type: "user" }));
          results = sortByNewest(results);
        }

        // Category filter (client-side)
        if (selectedCategory !== "all") {
          results = results.filter((r) => {
            const cat = (r.category || "").toLowerCase();
            return cat === selectedCategory.toLowerCase();
          });
        }

        // Normalize status field variations (approved / published)
        results = results.map((r) => {
          const normalized = { ...r };
          if (!normalized.status && normalized.approved) {
            normalized.status = normalized.approved === true ? "published" : "pending";
          }
          return normalized;
        });

        if (!mountedRef.current) return;
        setArticles(results);
      } catch (error) {
        console.error("Error loading content:", error);
        if (showToast) toast.error("Failed to load content");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [activeTab, selectedCategory]
  );

  useEffect(() => {
    mountedRef.current = true;
    // Initial load
    loadContent();

    // Setup BroadcastChannel listeners (multiple channel names handled)
    const setupBC = (name) => {
      try {
        if (typeof window === "undefined") return null;
        if (!("BroadcastChannel" in window)) return null;
        const bc = new BroadcastChannel(name);
        bc.onmessage = (ev) => {
          const msg = ev?.data || {};
          // Accept a variety of message types used across admin/tools
          const triggers = new Set([
            "article-approved",
            "article-updated",
            "article-created",
            "article_status_changed",
            "ARTICLE_PUBLISHED",
            "ARTICLE_UPDATED",
            "ARTICLE_DELETED",
            "article_deleted",
          ]);
          try {
            if (msg && (triggers.has(msg.type) || triggers.has(msg?.action) || (msg?.payload && msg.payload.type && triggers.has(msg.payload.type)))) {
              // lightweight debounce: reload once per message
              loadContent(false).catch(() => {});
            }
          } catch (e) {
            console.warn("Broadcast parse error", e);
          }
        };
        return bc;
      } catch (err) {
        console.warn("BroadcastChannel error", err);
        return null;
      }
    };

    const bc1 = setupBC("press-india");
    const bc2 = setupBC("article_updates");
    const bc3 = setupBC("app_broadcast");

    // store refs so we can close later
    bcRefs.current = [bc1, bc2, bc3].filter(Boolean);

    // Poll fallback every 30s (in case BroadcastChannel unsupported)
    pollRef.current = setInterval(() => {
      loadContent(false).catch(() => {});
    }, 30_000);

    return () => {
      mountedRef.current = false;
      // close channels
      (bcRefs.current || []).forEach((c) => {
        try {
          c.close && c.close();
        } catch (e) {
          /* ignore */
        }
      });
      bcRefs.current = [];
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // reload when dependencies change
  useEffect(() => {
    loadContent();
  }, [activeTab, selectedCategory, loadContent]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Explore News & Articles</h1>
          <p className="text-lg opacity-90">Discover trending stories, latest news, and community articles</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Content Type Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => setActiveTab("trending")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "trending" ? "bg-red-500 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaFire /> Trending
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "recent" ? "bg-blue-500 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaClock /> Recent
          </button>
          <button
            onClick={() => setActiveTab("news")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "news" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaNewspaper /> Google News
          </button>
          <button
            onClick={() => setActiveTab("articles")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "articles" ? "bg-green-500 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaUser /> User Articles
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                  selectedCategory === cat.id ? `${cat.color} text-white shadow-lg scale-105` : "bg-white text-gray-700 hover:shadow-md"
                }`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs font-semibold text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          </div>
        ) : articles.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === "trending" && "🔥 Trending Now"}
                {activeTab === "recent" && "🕐 Latest Updates"}
                {activeTab === "news" && "📰 Google News"}
                {activeTab === "articles" && "✍️ Community Articles"}
              </h2>
              <p className="text-gray-600">{articles.length} items</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <NewsCard key={article.id || article.slug || index} article={article} viewMode="grid" />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4"><FaImageIcon size={40} /></div>
            <p className="text-gray-500 text-lg">No content found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
