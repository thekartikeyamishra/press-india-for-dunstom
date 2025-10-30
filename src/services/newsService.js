// src/services/newsService.js
// ============================================
// NEWS SERVICE - Google News Direct RSS
// NO API KEY NEEDED - FREE FOREVER!
// ============================================

// Category-specific default images
const DEFAULT_IMAGES = {
  all: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  india: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  world: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80',
  business: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  entertainment: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
  health: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
  general: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'
};

// Google News RSS Feed URLs for India
const GOOGLE_NEWS_RSS = {
  all: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
  india: 'https://news.google.com/rss/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFZ4ZERBU0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en',
  world: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en',
  business: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en',
  technology: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en',
  entertainment: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en',
  sports: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en',
  science: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en',
  health: 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0JXVnVMVWRDS0FBUAE?hl=en-IN&gl=IN&ceid=IN:en'
};

// RSS to JSON API - More reliable than CORS proxies
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

class NewsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    console.log('📰 Google News Service initialized');
    console.log('✅ No API key required!');
    console.log('✅ Unlimited requests');
    console.log('✅ Real-time news from Google News');
  }

  /**
   * Parse XML RSS feed to extract articles
   */
  parseRSSFeed(xmlString, category) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.warn('⚠️ XML parsing error, returning empty array');
        return [];
      }
    
      const items = xmlDoc.querySelectorAll('item');
      const articles = [];
      
      items.forEach((item) => {
        try {
          // Extract data from XML
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
          const description = item.querySelector('description')?.textContent || '';
          const source = item.querySelector('source')?.textContent || 'Google News';
          
          // Skip if no title or link
          if (!title || !link) return;
          
          // Extract image from description
          let imageUrl = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.general;
          if (description) {
            const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
              imageUrl = imgMatch[1];
            }
          }
          
          // Clean description (remove HTML tags)
          const cleanDescription = this.stripHtml(description).substring(0, 200);
          
          articles.push({
            title: title.trim(),
            link: link.trim(),
            pubDate: pubDate,
            description: cleanDescription,
            imageUrl: imageUrl,
            source: source
          });
        } catch (error) {
          console.warn('⚠️ Error parsing article:', error);
        }
      });
      
      return articles;
    } catch (error) {
      console.error('⚠️ Error in parseRSSFeed:', error);
      return [];
    }
  }

  /**
   * Fetch news from Google News RSS feed
   */
  async fetchFromGoogleNews(category = 'all') {
    try {
      const rssUrl = GOOGLE_NEWS_RSS[category] || GOOGLE_NEWS_RSS.all;
      const apiUrl = `${RSS2JSON_API}${encodeURIComponent(rssUrl)}`;
      
      console.log('🌐 Fetching from Google News...');
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.status !== 'ok' || !data.items || data.items.length === 0) {
        throw new Error('No articles found');
      }
      
      console.log(`✅ Fetched ${data.items.length} articles`);
      
      return data.items.map(item => ({
        id: this.generateId(item.link || item.guid),
        title: item.title,
        description: this.stripHtml(item.description || item.content || '').substring(0, 200),
        urlToImage: this.getValidImageUrl(item.enclosure?.link || item.thumbnail, category),
        url: item.link || item.guid,
        source: 'Google News',
        author: item.author || 'Google News',
        category: category,
        publishedAt: item.pubDate,
        content: this.stripHtml(item.description || item.content || '')
      }));
      
    } catch (error) {
      console.error('❌ Error fetching news:', error.message);
      return [];
    }
  }

  /**
   * Format Google News articles to our standard format
   */
  formatGoogleNewsArticles(items, category) {
    return items.map(item => ({
      id: this.generateId(item.link),
      title: item.title,
      description: item.description || 'Click to read full article',
      urlToImage: this.getValidImageUrl(item.imageUrl, category),
      url: item.link,
      source: item.source, // ✅ This is already a STRING
      author: item.source,
      category: category,
      publishedAt: item.pubDate,
      content: item.description
    }));
  }

  /**
   * Strip HTML tags from text
   */
  stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Get valid image URL or return category-specific default
   */
  getValidImageUrl(imageUrl, category = 'general') {
    if (!imageUrl || imageUrl === '' || imageUrl === null) {
      return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.general;
    }

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.general;
    }

    return imageUrl;
  }

  /**
   * Generate unique ID from URL
   * CRITICAL: Must be truly unique - no duplicates allowed!
   */
  generateId(url) {
    try {
      // Use a counter to ensure uniqueness even if called at same millisecond
      if (!window._newsIdCounter) {
        window._newsIdCounter = 0;
      }
      window._newsIdCounter++;
      
      // Combine: URL hash + timestamp + counter + random
      const urlPart = btoa(url).substring(0, 8);
      const timePart = Date.now().toString(36);
      const counterPart = window._newsIdCounter.toString(36);
      const randomPart = Math.random().toString(36).substring(2, 9);
      
      return `${urlPart}-${timePart}-${counterPart}-${randomPart}`;
    } catch {
      // Ultra-safe fallback
      if (!window._newsIdCounter) {
        window._newsIdCounter = 0;
      }
      window._newsIdCounter++;
      return `news-${Date.now()}-${window._newsIdCounter}-${Math.random().toString(36).substring(2, 12)}`;
    }
  }

  /**
   * Get cached news or fetch fresh
   */
  async getNews(category = 'all', forceRefresh = false) {
    const cacheKey = `news-${category}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      const age = Date.now() - cached.timestamp;
      
      if (age < this.cacheTimeout) {
        console.log(`📦 Returning cached news for ${category} (age: ${Math.round(age/1000/60)}min)`);
        return cached.data;
      }
    }

    // Fetch fresh news
    console.log(`🔄 Fetching fresh news for ${category}`);
    
    try {
      const articles = await this.fetchFromGoogleNews(category);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: articles,
        timestamp: Date.now()
      });
      
      return articles;
      
    } catch (error) {
      console.error('❌ Failed to fetch news:', error.message);
      
      // If we have cached data, return it even if expired
      if (this.cache.has(cacheKey)) {
        console.log('📦 Returning stale cached data due to fetch error');
        return this.cache.get(cacheKey).data;
      }
      
      // No cache available, return empty array
      return [];
    }
  }

  /**
   * Refresh news (clear cache and fetch)
   */
  async refreshNews(category = 'all') {
    const cacheKey = `news-${category}`;
    this.cache.delete(cacheKey);
    console.log('🔄 Cache cleared, fetching fresh news...');
    return await this.getNews(category, true);
  }

  /**
   * Search news by query
   */
  async searchNews(query, category = 'all') {
    try {
      const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const apiUrl = `${RSS2JSON_API}${encodeURIComponent(searchUrl)}`;
      
      console.log('🔍 Searching news:', query);
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      if (data.status !== 'ok' || !data.items) return [];
      
      return data.items.map(item => ({
        id: this.generateId(item.link || item.guid),
        title: item.title,
        description: this.stripHtml(item.description || '').substring(0, 200),
        urlToImage: this.getValidImageUrl(item.enclosure?.link || item.thumbnail, category),
        url: item.link || item.guid,
        source: 'Google News',
        author: item.author || 'Google News',
        category: category,
        publishedAt: item.pubDate,
        content: this.stripHtml(item.description || '')
      }));
      
    } catch (error) {
      console.error('❌ Search error:', error);
      return [];
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ All news cache cleared');
  }
}

const newsService = new NewsService();
export default newsService;
export const getGoogleNews = (category) => newsService.getNews(category);
export const searchGoogleNews = (query, category) => newsService.searchNews(query, category);
export const refreshGoogleNews = (category) => newsService.refreshNews(category);
