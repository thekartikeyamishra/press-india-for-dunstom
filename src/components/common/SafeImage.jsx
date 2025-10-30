import React, { useState, useEffect } from 'react';
import { getArticleImage, generateThumbnail } from '../../utils/thumbnailGenerator';

const SafeImage = ({ article, src, alt = 'Image', className = '', fallbackCategory = 'general', ...props }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [src, article]);

  const loadImage = () => {
    try {
      let imageUrl;
      if (article) {
        imageUrl = getArticleImage(article);
      } else if (src) {
        imageUrl = src;
      } else {
        imageUrl = generateThumbnail('Article', fallbackCategory);
      }
      setImageSrc(imageUrl);
    } catch (error) {
      console.error('Error loading image:', error);
      handleImageError();
    }
  };

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      try {
        const fallback = article ? generateThumbnail(article.title || 'Article', article.category || fallbackCategory) : generateThumbnail('Article', fallbackCategory);
        setImageSrc(fallback);
      } catch (error) {
        console.error('Error generating fallback:', error);
        setImageSrc(`data:image/svg+xml,${encodeURIComponent('<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="400" fill="#667eea"/><text x="400" y="200" font-family="Arial" font-size="48" fill="white" text-anchor="middle">Press India</text></svg>')}`);
      }
    }
  };

  return imageSrc ? <img src={imageSrc} alt={alt} className={className} onError={handleImageError} loading="lazy" {...props} /> : null;
};

export default SafeImage;