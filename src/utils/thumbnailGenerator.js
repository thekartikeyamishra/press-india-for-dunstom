// File: src/utils/thumbnailGenerator.js

/**
 * Category color schemes
 */
export const CATEGORY_COLORS = {
  politics: { bg: '#667eea', text: '#ffffff', icon: '🏛️' },
  business: { bg: '#f093fb', text: '#ffffff', icon: '💼' },
  technology: { bg: '#4facfe', text: '#ffffff', icon: '💻' },
  sports: { bg: '#43e97b', text: '#ffffff', icon: '⚽' },
  entertainment: { bg: '#fa709a', text: '#ffffff', icon: '🎬' },
  health: { bg: '#30cfd0', text: '#ffffff', icon: '🏥' },
  science: { bg: '#a8edea', text: '#333333', icon: '🔬' },
  education: { bg: '#ff9a9e', text: '#ffffff', icon: '📚' },
  world: { bg: '#ffecd2', text: '#333333', icon: '🌍' },
  general: { bg: '#667eea', text: '#ffffff', icon: '📰' },
  default: { bg: '#667eea', text: '#ffffff', icon: '📰' }
};

export const getCategoryColor = (category) => {
  try {
    const normalizedCategory = String(category || 'general').toLowerCase();
    return CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.default;
  } catch (error) {
    return CATEGORY_COLORS.default;
  }
};

const escapeXml = (text) => {
  try {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  } catch (error) {
    return 'Article';
  }
};

export const generateThumbnail = (title, category = 'general') => {
  try {
    const colors = getCategoryColor(category);
    const safeTitle = String(title || 'Untitled Article').substring(0, 100);
    const displayTitle = safeTitle.length > 60 ? safeTitle.substring(0, 60) + '...' : safeTitle;
    
    const words = displayTitle.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length > 20 && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }
    
    const displayLines = lines.slice(0, 3);
    const uniqueId = Math.random().toString(36).substr(2, 9);
    
    const textElements = displayLines.map((line, index) => {
      const yPosition = 180 + (index * 50);
      return `<text x="40" y="${yPosition}" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="${colors.text}">${escapeXml(line)}</text>`;
    }).join('');
    
    const svg = `<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${uniqueId}" x1="0" y1="0" x2="800" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0" style="stop-color:${colors.bg};stop-opacity:1" />
      <stop offset="1" style="stop-color:${colors.bg};stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#grad-${uniqueId})"/>
  <text x="40" y="80" font-family="Arial,sans-serif" font-size="60" fill="${colors.text}" opacity="0.3">${colors.icon}</text>
  ${textElements}
  <rect x="40" y="350" width="150" height="35" rx="17.5" fill="rgba(255,255,255,0.2)"/>
  <text x="115" y="375" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="${colors.text}" text-anchor="middle">${escapeXml(String(category).toUpperCase())}</text>
  <text x="760" y="380" font-family="Arial,sans-serif" font-size="14" fill="${colors.text}" opacity="0.5" text-anchor="end">Press India</text>
</svg>`;
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return `data:image/svg+xml,${encodeURIComponent('<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="400" fill="#667eea"/><text x="400" y="200" font-family="Arial" font-size="48" fill="white" text-anchor="middle">Press India</text></svg>')}`;
  }
};

export const isValidImageUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:image/svg+xml')) return true;
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const getArticleImage = (article) => {
  try {
    const possibleImages = [
      article?.imageUrl,
      article?.featuredImage,
      article?.urlToImage,
      article?.image,
      article?.thumbnail
    ];
    
    for (const img of possibleImages) {
      if (img && isValidImageUrl(img)) {
        return img;
      }
    }
    
    return generateThumbnail(
      article?.title || 'Untitled Article',
      article?.category || 'general'
    );
  } catch (error) {
    console.error('Error getting article image:', error);
    return generateThumbnail('Article', 'general');
  }
};