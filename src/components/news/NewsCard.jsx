// src/components/news/NewsCard.jsx
// ============================================
// NEWS CARD COMPONENT - Production Ready
// Displays news article with proper error handling
// ============================================
/*
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaUser, FaExternalLinkAlt, FaBook, FaHeart, FaRegHeart, FaEye } from 'react-icons/fa';
import { auth } from '../../config/firebase';
import { likeArticle } from '../../services/articleService';
import toast from 'react-hot-toast';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';

const NewsCard = ({ article, viewMode = 'grid' }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(article?.likes || 0);
  const [liking, setLiking] = useState(false);
  
  const isUserArticle = article?.type === 'user';

  // Check if user has liked this article
  useEffect(() => {
    const user = auth.currentUser;
    if (user && article?.likedBy) {
      setLiked(article.likedBy.includes(user.uid));
    }
    setLikes(article?.likes || 0);
  }, [article]);

  // Safely extract source name - handle ALL possible formats
  const getSourceName = () => {
    if (!article || !article.source) {
      return 'Press India';
    }
    
    // If source is an object (from some APIs), extract the name
    if (typeof article.source === 'object' && article.source !== null) {
      return article.source.name || article.source.id || 'Press India';
    }
    
    // If source is already a string, return it
    if (typeof article.source === 'string') {
      return article.source;
    }
    
    return 'Press India';
  };

  // Get valid image URL with proper error handling
  const getImageUrl = () => {
    // If there was an error loading the image, use default
    if (imageError) {
      return DEFAULT_IMAGE;
    }
    
    // If article doesn't have an image, use default
    if (!article || !article.urlToImage) {
      return DEFAULT_IMAGE;
    }
    
    // Validate the URL format
    const url = article.urlToImage;
    if (typeof url !== 'string' || url.trim() === '') {
      return DEFAULT_IMAGE;
    }
    
    // Check if URL starts with http/https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return DEFAULT_IMAGE;
    }
    
    return url;
  };

  // Handle image load error
  const handleImageError = () => {
    if (!imageError) {
      console.warn(`Image failed to load for article: ${article?.title || 'Unknown'}`);
      setImageError(true);
      setImageLoading(false);
    }
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Format date to relative time
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
      }
    } catch  {
      return 'Recently';
    }
  };

  // Get author name safely
  const getAuthorName = () => {
    if (!article) return 'Press India';
    return article.author || article.source || 'Press India';
  };

  // Handle like/unlike
  const handleLike = async (e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please login to like articles');
      navigate('/auth');
      return;
    }
    if (!isUserArticle) return;
    try {
      setLiking(true);
      const result = await likeArticle(article.id, user.uid);
      setLikes(result.likes);
      setLiked(result.liked);
    } catch (error) {
      console.error('Error liking article:', error);
      toast.error('Failed to like article');
    } finally {
      setLiking(false);
    }
  };

  // Validate article data
  if (!article || !article.title) {
    return null; // Don't render if article is invalid
  }

  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          <img
            src={getImageUrl()}
            alt={article.title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />
          
          {article.category && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                {article.category}
              </span>
            </div>
          )}

          <div className="absolute bottom-2 right-2">
            <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
              {getSourceName()}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
            {article.title}
          </h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
            {article.description || 'Click to read full article'}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t">
            <div className="flex items-center gap-1">
              <FaUser className="text-gray-400" />
              <span className="truncate max-w-[120px]">
                {getAuthorName()}
              </span>
            </div>
            {article.publishedAt && (
              <div className="flex items-center gap-1">
                <FaClock className="text-gray-400" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}
          </div>

          {isUserArticle && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1 ${liked ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}
              >
                {liked ? <FaHeart /> : <FaRegHeart />}
                <span>{likes}</span>
              </button>
              {article.views !== undefined && (
                <div className="flex items-center gap-1">
                  <FaEye />
                  <span>{article.views}</span>
                </div>
              )}
            </div>
          )}

          {isUserArticle ? (
            <button
              onClick={() => navigate(`/articles/${article.id}`)}
              className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
            >
              Read Article
              <FaBook className="text-xs" />
            </button>
          ) : article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
            >
              Read Full Article
              <FaExternalLinkAlt className="text-xs" />
            </a>
          )}
        </div>
      </article>
    );
  }

  // List view layout
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 mb-4">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-64 h-48 md:h-auto bg-gray-200 flex-shrink-0">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          <img
            src={getImageUrl()}
            alt={article.title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />
          
          {article.category && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                {article.category}
              </span>
            </div>
          )}
        </div>

]        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">
            {article.title}
          </h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {article.description || 'Click to read full article'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <FaUser className="text-gray-400" />
              <span>{getAuthorName()}</span>
            </div>
            {article.publishedAt && (
              <div className="flex items-center gap-1">
                <FaClock className="text-gray-400" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-gray-400">📰</span>
              <span>{getSourceName()}</span>
            </div>
            {isUserArticle && (
              <>
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-1 ${liked ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{likes}</span>
                </button>
                {article.views !== undefined && (
                  <div className="flex items-center gap-1">
                    <FaEye />
                    <span>{article.views}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {isUserArticle ? (
            <button
              onClick={() => navigate(`/articles/${article.id}`)}
              className="inline-flex items-center gap-2 bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold self-start"
            >
              Read Article
              <FaBook className="text-xs" />
            </button>
          ) : article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold self-start"
            >
              Read Full Article
              <FaExternalLinkAlt className="text-xs" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
*/

// E:\press-india\src\components\news\NewsCard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClock,
  FaUser,
  FaExternalLinkAlt,
  FaBook,
  FaHeart,
  FaRegHeart,
  FaEye,
  FaImage as FaImageIcon,
} from "react-icons/fa";
import { auth } from "../../config/firebase";
import toast from "react-hot-toast";
import { toggleLikeArticle } from "../../services/articleService"; // <- use the correct exported function

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80";

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const NewsCard = ({ article = {}, viewMode = "grid" }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(safeNumber(article.likes));
  const [liking, setLiking] = useState(false);

  const isUserArticle = article?.type === "user" || !!article?.userId;

  useEffect(() => {
    setLikes(safeNumber(article?.likes));
    try {
      const user = auth.currentUser;
      if (user && Array.isArray(article?.likedBy)) {
        setLiked(article.likedBy.includes(user.uid));
      } else {
        setLiked(false);
      }
    } catch {
      setLiked(false);
    }
  }, [article]);

  const getSourceName = () => {
    if (!article) return "Press India";
    if (article.source && typeof article.source === "string") return article.source;
    if (article.source && typeof article.source === "object") {
      return article.source.name || article.source.id || "Press India";
    }
    if (article.publisher) return article.publisher;
    return "Press India";
  };

  const getImageUrl = () => {
    if (imageError) return DEFAULT_IMAGE;
    const candidates = [
      article.featuredImage,
      article.imageUrl,
      article.urlToImage,
      article.image,
    ];
    for (const c of candidates) {
      if (c && typeof c === "string" && (c.startsWith("http://") || c.startsWith("https://"))) {
        return c;
      }
    }
    return DEFAULT_IMAGE;
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageLoading(false);
      console.warn("NewsCard: image failed for", article?.title || article?.id);
    }
  };

  const handleImageLoad = () => setImageLoading(false);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Recently";
      const d = typeof dateString === "object" && dateString?.seconds
        ? new Date(dateString.seconds * 1000)
        : new Date(dateString);
      const diff = Date.now() - d.getTime();
      if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
      if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
      if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
      return `${Math.floor(diff / 86_400_000)}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getAuthorName = () => {
    return article.author || article.authorName || article.source || "Press India";
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please login to like articles");
      navigate("/auth");
      return;
    }
    if (!isUserArticle) {
      // Only allow liking for user-created articles
      toast.error("Can't like this item");
      return;
    }

    if (!article?.id) {
      toast.error("Invalid article");
      return;
    }

    try {
      setLiking(true);
      // toggleLikeArticle(articleId, userId, likeBool)
      const wantToLike = !liked;
      const newCount = await toggleLikeArticle(article.id, user.uid, wantToLike);
      // Our service returns the new like count (number)
      setLikes(safeNumber(newCount));
      setLiked(wantToLike);
    } catch (err) {
      console.error("Error liking article:", err);
      toast.error("Failed to update like");
    } finally {
      setLiking(false);
    }
  };

  if (!article || !article.title) return null;

  // GRID VIEW
  if (viewMode === "grid") {
    return (
      <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          <img
            src={getImageUrl()}
            alt={article.title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"}`}
            loading="lazy"
          />

          {article.category && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                {article.category}
              </span>
            </div>
          )}

          <div className="absolute bottom-2 right-2">
            <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
              {getSourceName()}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
            {article.description || article.summary || "Click to read full article"}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t">
            <div className="flex items-center gap-1">
              <FaUser className="text-gray-400" />
              <span className="truncate max-w-[120px]">{getAuthorName()}</span>
            </div>

            {article.publishedAt && (
              <div className="flex items-center gap-1">
                <FaClock className="text-gray-400" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}
          </div>

          {isUserArticle && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1 ${liked ? "text-red-500" : "hover:text-red-500"} transition-colors`}
                aria-label={liked ? "Unlike" : "Like"}
              >
                {liked ? <FaHeart /> : <FaRegHeart />}
                <span>{likes}</span>
              </button>

              {article.views !== undefined && (
                <div className="flex items-center gap-1">
                  <FaEye />
                  <span>{safeNumber(article.views)}</span>
                </div>
              )}
            </div>
          )}

          {isUserArticle ? (
            <button
              onClick={() => navigate(`/articles/${article.id}`)}
              className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
            >
              Read Article <FaBook className="text-xs" />
            </button>
          ) : article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              Read Full Article <FaExternalLinkAlt className="text-xs" />
            </a>
          ) : null}
        </div>
      </article>
    );
  }

  // LIST VIEW
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 mb-4">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-64 h-48 md:h-auto bg-gray-200 flex-shrink-0">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          <img
            src={getImageUrl()}
            alt={article.title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"}`}
            loading="lazy"
          />

          {article.category && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                {article.category}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary transition-colors">{article.title}</h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{article.description || article.summary || "Click to read full article"}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <FaUser className="text-gray-400" />
              <span>{getAuthorName()}</span>
            </div>

            {article.publishedAt && (
              <div className="flex items-center gap-1">
                <FaClock className="text-gray-400" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="text-gray-400">📰</span>
              <span>{getSourceName()}</span>
            </div>

            {isUserArticle && (
              <>
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-1 ${liked ? "text-red-500" : "hover:text-red-500"} transition-colors`}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{likes}</span>
                </button>

                {article.views !== undefined && (
                  <div className="flex items-center gap-1">
                    <FaEye />
                    <span>{safeNumber(article.views)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {isUserArticle ? (
            <button
              onClick={() => navigate(`/articles/${article.id}`)}
              className="inline-flex items-center gap-2 bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold self-start"
            >
              Read Article <FaBook className="text-xs" />
            </button>
          ) : article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold self-start"
              onClick={(e) => e.stopPropagation()}
            >
              Read Full Article <FaExternalLinkAlt className="text-xs" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
