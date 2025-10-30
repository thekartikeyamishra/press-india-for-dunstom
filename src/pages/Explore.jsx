// E:\press-india\src\pages\Explore.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { FaFire, FaNewspaper, FaUser, FaClock, FaImage as FaImageIcon } from "react-icons/fa";
import NewsCard from "../components/news/NewsCard";
import { getPublishedArticles } from "../services/articleService"; // stable exported fn
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

const safeDateVal = (a) => {
  if (!a) return null;
  const picks = [a.publishedAt, a.createdAt, a.updatedAt, a.published_at, a.date];
  for (const p of picks) {
    if (!p) continue;
    try {
      // Firestore timestamp object support (has seconds) and ISO strings
      if (typeof p === "object" && p !== null && typeof p.seconds === "number") {
        return new Date(p.seconds * 1000);
      }
      const d = new Date(p);
      if (!isNaN(d.getTime())) return d;
    } catch {
      // ignore
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
  const all = (await getPublishedArticles(limit * 3)).slice(0, limit * 3) || [];
  // compute score
  const scored = all.map((a) => {
    const likes = Number(a.likes || 0);
    const views = Number(a.views || 0);
    // weight likes higher
    const score = likes * 3 + views;
    return { score, article: a };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((s) => s.article);
}

const Explore = () => {
  const [activeTab, setActiveTab] = useState("trending");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const bcRef1 = useRef(null);
  const bcRef2 = useRef(null);
  const pollRef = useRef(null);

  const loadContent = useCallback(
    async (showToast = true) => {
      setLoading(true);
      try {
        let results = [];

        if (activeTab === "trending") {
          // get trending from local helper (uses getPublishedArticles under the hood)
          const trending = await getTrendingArticlesLocal(20);
          results = (Array.isArray(trending) ? trending : []).map((a) => ({ ...a, type: "user" }));
        } else if (activeTab === "recent") {
          // fetch user articles (published) and google news in parallel
          const [userArticles, newsArticles] = await Promise.allSettled([
            getPublishedArticles(50).catch((e) => {
              console.error("getPublishedArticles error", e);
              return [];
            }),
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
          const userArticles = await getPublishedArticles(50).catch((e) => {
            console.error("getPublishedArticles error", e);
            return [];
          });
          results = (Array.isArray(userArticles) ? userArticles : []).map((a) => ({ ...a, type: "user" }));
          results = sortByNewest(results);
        }

        // Client-side category filter (if category selected and tab is relevant)
        if (selectedCategory !== "all") {
          results = results.filter((r) => {
            const cat = (r.category || "").toLowerCase();
            return cat === selectedCategory.toLowerCase();
          });
        }

        setArticles(results);
      } catch (error) {
        console.error("Error loading content:", error);
        if (showToast) toast.error("Failed to load content");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, selectedCategory]
  );

  useEffect(() => {
    // initial load + setup BroadcastChannel listeners
    loadContent();

    // listen to both possible channels (some parts of app used "press-india", some "article_updates")
    try {
      if ("BroadcastChannel" in window) {
        bcRef1.current = new BroadcastChannel("press-india");
        bcRef1.current.onmessage = (ev) => {
          try {
            const msg = ev.data || {};
            if (msg && (msg.type === "article-approved" || msg.type === "article-updated" || msg.type === "article-created")) {
              loadContent();
            }
          } catch (e) {
            console.warn("BC press-india parse error", e);
          }
        };

        bcRef2.current = new BroadcastChannel("article_updates");
        bcRef2.current.onmessage = (ev) => {
          try {
            const msg = ev.data || {};
            if (msg && (msg.type === "ARTICLE_PUBLISHED" || msg.type === "ARTICLE_UPDATED" || msg.type === "ARTICLE_DELETED")) {
              // sync behavior: refresh list
              loadContent();
            }
          } catch (e) {
            console.warn("BC article_updates parse error", e);
          }
        };
      }
    } catch (err) {
      console.warn("BroadcastChannel not available", err);
    }

    // fallback poll every 30s
    pollRef.current = setInterval(() => {
      loadContent(false).catch(() => {});
    }, 30_000);

    return () => {
      if (bcRef1.current) {
        try {
          bcRef1.current.close();
        } catch {
          // Ignore close errors
        }
        bcRef1.current = null;
      }
      if (bcRef2.current) {
        try {
          bcRef2.current.close();
        } catch {
          // Ignore close errors
        }
        bcRef2.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run on mount only

  useEffect(() => {
    // reload when tab/category changes
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
