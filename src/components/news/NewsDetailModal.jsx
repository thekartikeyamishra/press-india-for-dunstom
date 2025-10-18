import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaClock, FaExternalLinkAlt, FaFlag } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NewsDetailModal = ({ article, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!article) return null;

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  const handleReport = () => {
    onClose();
    navigate(`/grievances/report?article=${article.id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />

          {/* Modal */}
          <Motion.div
            initial={{ opacity: 0, scale:0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 bg-white rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1">
                <span className="inline-block px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-xs font-medium mb-2">
                  {article.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 line-clamp-2">
                  {article.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FaTimes className="text-gray-600 text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Image */}
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FaClock />
                  <span>{timeAgo}</span>
                </div>
                <div>
                  <span className="font-medium">By:</span> {article.author}
                </div>
                <div>
                  <span className="font-medium">Source:</span> {article.source.name}
                </div>
              </div>

              {/* Description */}
              {article.description && (
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  {article.description}
                </p>
              )}

              {/* Content */}
              {article.content && article.content !== article.description && (
                <div className="prose prose-lg max-w-none mb-6">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </p>
                </div>
              )}

              {/* Source Attribution */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <p className="text-xs text-gray-600 mb-2">
                  <strong>Source:</strong> {article.source.attribution}
                </p>
                <a
                  href={article.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                >
                  Read full article at source
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleReport}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <FaFlag />
                Report Issue
              </button>

              <a
                href={article.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
              >
                View Original
                <FaExternalLinkAlt />
              </a>
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsDetailModal;