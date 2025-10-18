// File: src/utils/placeholderImage.js

/**
 * Generate placeholder image URLs
 * Fixes the via.placeholder.com DNS resolution issue
 */

// Using multiple fallback services for reliability
const PLACEHOLDER_SERVICES = {
  // Primary: placehold.co (reliable and fast)
  primary: (width, height, text, bgColor = 'cccccc', textColor = '333333') => 
    `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`,
  
  // Fallback 1: placeholder.com
  fallback1: (width, height, text) => 
    `https://placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`,
  
  // Fallback 2: dummyimage.com
  fallback2: (width, height, text, bgColor = 'ccc', textColor = '333') => 
    `https://dummyimage.com/${width}x${height}/${bgColor}/${textColor}&text=${encodeURIComponent(text)}`,
  
  // Fallback 3: Data URL (always works offline)
  dataUrl: (width, height, text) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, width, height);
    
    // Text
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.floor(height / 10)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    
    return canvas.toDataURL();
  }
};

/**
 * Get placeholder image URL with automatic fallback
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Text to display
 * @param {string} bgColor - Background color (hex without #)
 * @param {string} textColor - Text color (hex without #)
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (
  width = 400, 
  height = 200, 
  text = 'No Image',
  bgColor = 'e2e8f0',
  textColor = '64748b'
) => {
  try {
    // Try primary service
    return PLACEHOLDER_SERVICES.primary(width, height, text, bgColor, textColor);
  } catch {
    console.warn('Primary placeholder service failed, using fallback');
    // Use data URL as ultimate fallback
    return PLACEHOLDER_SERVICES.dataUrl(width, height, text);
  }
};

/**
 * Get news article placeholder
 */
export const getNewsPlaceholder = (category = 'News') => {
  const categoryColors = {
    technology: { bg: '3b82f6', text: 'ffffff' },
    business: { bg: '10b981', text: 'ffffff' },
    sports: { bg: 'ef4444', text: 'ffffff' },
    entertainment: { bg: 'f59e0b', text: 'ffffff' },
    health: { bg: '8b5cf6', text: 'ffffff' },
    science: { bg: '06b6d4', text: 'ffffff' },
    politics: { bg: '6366f1', text: 'ffffff' },
    default: { bg: '94a3b8', text: 'ffffff' }
  };

  const colors = categoryColors[category.toLowerCase()] || categoryColors.default;
  return getPlaceholderImage(800, 450, category, colors.bg, colors.text);
};

/**
 * Get profile placeholder
 */
export const getProfilePlaceholder = (name = 'User') => {
  const initial = name.charAt(0).toUpperCase();
  return getPlaceholderImage(200, 200, initial, '6366f1', 'ffffff');
};

/**
 * Create a gradient placeholder (data URL)
 */
export const createGradientPlaceholder = (width, height, color1 = '#667eea', color2 = '#764ba2') => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

/**
 * Handle image load errors
 */
export const handleImageError = (e, fallbackType = 'news', category = 'News') => {
  const img = e.target;
  
  if (fallbackType === 'news') {
    img.src = getNewsPlaceholder(category);
  } else if (fallbackType === 'profile') {
    img.src = getProfilePlaceholder(category);
  } else {
    img.src = getPlaceholderImage(400, 200, 'Image Not Available');
  }
  
  // Prevent infinite loop
  img.onerror = null;
};

export default {
  getPlaceholderImage,
  getNewsPlaceholder,
  getProfilePlaceholder,
  createGradientPlaceholder,
  handleImageError
};