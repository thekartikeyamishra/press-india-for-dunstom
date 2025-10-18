// File: src/components/news/NewsCard.jsx

import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { FaClock, FaUser, FaExternalLinkAlt, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { getNewsPlaceholder } from '../../utils/placeholderImage';

const NewsCard = ({ article, viewMode = 'grid' }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      technology: 'bg-blue-100 text-blue-700',
      business: 'bg-green-100 text-green-700',
      sports: 'bg-red-100 text-red-700',
      entertainment: 'bg-purple-100 text-purple-700',
      health: 'bg-pink-100 text-pink-700',
      science: 'bg-cyan-100 text-cyan-700',
      politics: 'bg-indigo-100 text-indigo-700',
      general: 'bg-gray-100 text-gray-700'
    };
    return colors[category?.toLowerCase()] || colors.general;
  };

  // Get image URL with fallback
  const getImageUrl = () => {
    if (imageError || !article.urlToImage) {
      return getNewsPlaceholder(article.category || 'News');
    }
    return article.urlToImage;
  };

  // Handle image error
  const onImageError = () => {
    setImageError(true);
  };

  // Handle bookmark
  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // TODO: Save to Firestore
  };

  // Open article
  const openArticle = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (viewMode === 'list') {
    return (
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={openArticle}
      >
        <div className="flex gap-4 p-4">
          {/* Image */}
          <div className="w-48 h-32 flex-shrink-0">
            <img
              src={getImageUrl()}
              alt={article.title}
              onError={onImageError}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {/* Category and Bookmark */}
            <div className="flex justify-between items-start mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(article.category)}`}>
                {article.category || 'General'}
              </span>
              <button
                onClick={handleBookmark}
                className="text-gray-400 hover:text-primary transition-colors"
              >
                {isBookmarked ? <FaBookmark className="text-primary" /> : <FaRegBookmark />}
              </button>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-primary transition-colors">
              {article.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
              {article.description || article.content || 'No description available'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <FaUser className="text-xs" />
                  <span>{article.source?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaClock className="text-xs" />
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </div>
              <FaExternalLinkAlt className="text-primary" />
            </div>

            {/* Source Attribution */}
            {article.source?.name && (
              <div className="mt-2 text-xs text-gray-400">
                Source: {article.source.name}
              </div>
            )}
          </div>
        </div>
      </Motion.div>
    );
  }

  // Grid view
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={openArticle}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImageUrl()}
          alt={article.title}
          onError={onImageError}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(article.category)}`}>
            {article.category || 'General'}
          </span>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all"
        >
          {isBookmarked ? (
            <FaBookmark className="text-primary" />
          ) : (
            <FaRegBookmark className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {article.description || article.content || 'No description available'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div className="flex items-center gap-1">
            <FaUser className="text-xs" />
            <span className="truncate max-w-[120px]">{article.source?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaClock className="text-xs" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>

        {/* Source Attribution */}
        {article.source?.name && (
          <div className="mt-2 text-xs text-gray-400 text-center border-t pt-2">
            Source: {article.source.name}
          </div>
        )}
      </div>
    </Motion.div>
  );
};

export default NewsCard;