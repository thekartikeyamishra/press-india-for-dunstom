import { db } from '../config/firebase';
import { 
  collection, 
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Get NewsAPI key from environment with validation
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';

// Log API key status (without exposing the actual key)
if (!NEWS_API_KEY) {
  console.warn('⚠️ VITE_NEWS_API_KEY not found in environment variables');
  console.warn('⚠️ Using mock data. To get real news:');
  console.warn('   1. Go to https://newsapi.org/register');
  console.warn('   2. Get your free API key');
  console.warn('   3. Add VITE_NEWS_API_KEY=your_key to .env file');
  console.warn('   4. Restart the dev server');
} else {
  console.log('✅ NewsAPI key loaded:', NEWS_API_KEY.substring(0, 8) + '...');
}

class NewsService {
  constructor() {
    this.cache = new Map();
    this.isApiKeyValid = this.validateApiKey();
  }

  /**
   * Validate API key format
   */
  validateApiKey() {
    if (!NEWS_API_KEY) return false;
    if (NEWS_API_KEY === 'your_newsapi_key_here') return false;
    if (NEWS_API_KEY.length < 20) return false;
    return true;
  }

  /**
   * Get comprehensive mock news data
   */
  getMockNews(category) {
    console.log('📰 Using mock news data for category:', category);
    
    const mockArticles = [
      {
        title: "India's GDP Growth Surges to 8.2% in Latest Quarter",
        description: "India's economy shows remarkable resilience with GDP growth reaching 8.2%, driven by strong manufacturing and services sectors.",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        url: "https://economictimes.indiatimes.com/economy",
        source: { name: "Economic Times" },
        author: "ET Bureau",
        category: "business",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "IPL 2025: Record-Breaking Season Sees Unprecedented Viewership",
        description: "The Indian Premier League 2025 season concludes with record-breaking viewership numbers and thrilling matches.",
        urlToImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
        url: "https://www.espncricinfo.com/ipl",
        source: { name: "ESPN Cricinfo" },
        author: "Sports Desk",
        category: "sports",
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "India Launches Revolutionary AI Initiative for Education",
        description: "Government announces massive AI-powered education platform to reach millions of students across rural and urban areas.",
        urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        url: "https://www.education.gov.in",
        source: { name: "Ministry of Education" },
        author: "Tech Correspondent",
        category: "technology",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Bollywood's Biggest Blockbuster Crosses ₹1000 Crore Worldwide",
        description: "The latest Bollywood sensation becomes the highest-grossing Indian film of all time within three weeks of release.",
        urlToImage: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
        url: "https://www.bollywoodhungama.com",
        source: { name: "Bollywood Hungama" },
        author: "Entertainment Reporter",
        category: "entertainment",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Major Healthcare Reforms Announced to Strengthen Public Health",
        description: "Government unveils comprehensive healthcare reforms focusing on universal coverage and improved infrastructure.",
        urlToImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
        url: "https://www.mohfw.gov.in",
        source: { name: "Ministry of Health" },
        author: "Health Correspondent",
        category: "health",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Parliament Passes Landmark Digital Privacy Bill",
        description: "Historic legislation on digital privacy and data protection receives unanimous support in parliament session.",
        urlToImage: "https://images.unsplash.com/photo-1555374018-13a8994ab246?w=800&q=80",
        url: "https://www.pib.gov.in",
        source: { name: "PIB" },
        author: "Political Correspondent",
        category: "politics",
        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "ISRO Successfully Launches Advanced Communication Satellite",
        description: "India's space agency achieves another milestone with the successful launch of next-generation communication satellite.",
        urlToImage: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&q=80",
        url: "https://www.isro.gov.in",
        source: { name: "ISRO" },
        author: "Space Reporter",
        category: "technology",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Indian Stock Markets Reach New All-Time Highs",
        description: "Both Sensex and Nifty hit record peaks as investor confidence soars following positive economic indicators.",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        url: "https://www.moneycontrol.com",
        source: { name: "MoneyControl" },
        author: "Market Analyst",
        category: "business",
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Indian Athletes Win Multiple Medals at World Championships",
        description: "Indian contingent brings home impressive medal haul from World Athletics Championships in historic performance.",
        urlToImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
        url: "https://olympics.com",
        source: { name: "Olympics.com" },
        author: "Athletics Correspondent",
        category: "sports",
        publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Monsoon Forecast: Above-Normal Rainfall Expected This Year",
        description: "India Meteorological Department predicts above-normal monsoon, bringing relief to agriculture and water resources.",
        urlToImage: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80",
        url: "https://mausam.imd.gov.in",
        source: { name: "IMD" },
        author: "Weather Bureau",
        category: "general",
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Renewable Energy Sector Attracts Record ₹2 Lakh Crore Investment",
        description: "India's clean energy sector sees unprecedented investment as country accelerates towards 500GW renewable capacity target.",
        urlToImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
        url: "https://mnre.gov.in",
        source: { name: "MNRE" },
        author: "Energy Reporter",
        category: "business",
        publishedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "5G Revolution: India Crosses 100 Million 5G Subscribers",
        description: "India achieves remarkable milestone in 5G adoption, becoming one of the fastest-growing 5G markets globally.",
        urlToImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
        url: "https://www.dot.gov.in",
        source: { name: "Department of Telecom" },
        author: "Telecom Correspondent",
        category: "technology",
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Indian Cinema Makes Historic Entry at Cannes Film Festival",
        description: "Indian film receives standing ovation at Cannes, marking a significant moment for Indian cinema on global stage.",
        urlToImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
        url: "https://www.festival-cannes.com",
        source: { name: "Cannes Film Festival" },
        author: "Film Critic",
        category: "entertainment",
        publishedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Breakthrough: Indian Scientists Develop Low-Cost Cancer Treatment",
        description: "Researchers at AIIMS announce revolutionary cancer treatment that could make therapy accessible to millions.",
        urlToImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80",
        url: "https://www.aiims.edu",
        source: { name: "AIIMS" },
        author: "Medical Science Reporter",
        category: "health",
        publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "India and Global Partners Strengthen Climate Action Commitments",
        description: "International summit concludes with India leading major climate action initiatives and renewable energy partnerships.",
        urlToImage: "https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800&q=80",
        url: "https://www.unfccc.int",
        source: { name: "UNFCCC" },
        author: "Environmental Correspondent",
        category: "world",
        publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Digital India Initiative Reaches 1 Billion Digital Transactions",
        description: "India's digital payment revolution hits historic milestone with over 1 billion transactions in a single month.",
        urlToImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
        url: "https://www.npci.org.in",
        source: { name: "NPCI" },
        author: "FinTech Reporter",
        category: "technology",
        publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Smart Cities Mission Shows Remarkable Progress Across India",
        description: "Government's smart cities initiative achieves 80% completion with improved infrastructure and digital services.",
        urlToImage: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
        url: "https://smartcities.gov.in",
        source: { name: "Smart Cities Mission" },
        author: "Urban Development Reporter",
        category: "general",
        publishedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Indian Startup Ecosystem Becomes World's Third Largest",
        description: "India overtakes UK to become the third-largest startup ecosystem globally with over 100 unicorns.",
        urlToImage: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
        url: "https://www.startupindia.gov.in",
        source: { name: "Startup India" },
        author: "Business Reporter",
        category: "business",
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Filter by category
    const filtered = category === 'all' || category === 'general'
      ? mockArticles
      : mockArticles.filter(article => article.category === category);

    const articles = filtered.length > 0 ? filtered : mockArticles;

    return this.formatNewsArticles(articles, category);
  }

  /**
   * Fetch news from NewsAPI
   */
  async fetchFromNewsAPI(category = 'general') {
    // If API key is not valid, use mock data
    if (!this.isApiKeyValid) {
      console.warn('⚠️ NewsAPI key invalid or missing, using mock data');
      return this.getMockNews(category);
    }

    try {
      // Category mapping for NewsAPI
      const categoryMap = {
        'all': 'general',
        'india': 'general',
        'politics': 'general',
        'business': 'business',
        'technology': 'technology',
        'sports': 'sports',
        'entertainment': 'entertainment',
        'health': 'health',
        'world': 'general'
      };

      const apiCategory = categoryMap[category] || 'general';
      const url = `${NEWS_API_BASE}/top-headlines?country=in&category=${apiCategory}&pageSize=50&apiKey=${NEWS_API_KEY}`;
      
      console.log('📡 Fetching from NewsAPI:', { 
        category, 
        apiCategory,
        apiKey: NEWS_API_KEY.substring(0, 8) + '...'
      });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ NewsAPI HTTP Error:', response.status, errorText);
        return this.getMockNews(category);
      }
      
      const data = await response.json();
      
      if (data.status === 'error') {
        console.error('❌ NewsAPI Error:', data.code, data.message);
        if (data.code === 'apiKeyInvalid') {
          console.error('❌ Your API key is invalid. Please check your .env file');
        }
        return this.getMockNews(category);
      }

      if (!data.articles || data.articles.length === 0) {
        console.warn('⚠️ No articles from NewsAPI, using mock data');
        return this.getMockNews(category);
      }

      console.log(`✅ Successfully fetched ${data.articles.length} articles from NewsAPI`);
      return this.formatNewsArticles(data.articles, category);

    } catch (error) {
      console.error('❌ Error fetching from NewsAPI:', error.message);
      return this.getMockNews(category);
    }
  }

  /**
   * Format articles to consistent structure
   */
  formatNewsArticles(articles, category) {
    const now = new Date();
    
    return articles
      .filter(article => 
        article.title && 
        article.description && 
        article.title !== '[Removed]' &&
        !article.title.toLowerCase().includes('removed')
      )
      .map((article, index) => {
        const publishedDate = article.publishedAt 
          ? new Date(article.publishedAt) 
          : new Date(now - Math.random() * 86400000);

        return {
          id: this.generateId(article.title),
          title: article.title,
          description: article.description,
          content: article.content || article.description,
          imageUrl: article.urlToImage || `https://images.unsplash.com/photo-${1500000000000 + index}?w=800&q=80`,
          source: {
            name: article.source?.name || 'Press India',
            url: article.url || 'https://pressindia.com',
            attribution: 'via NewsAPI'
          },
          publishedAt: publishedDate,
          category: article.category || this.detectCategory(article) || category,
          language: 'en',
          author: article.author || 'Press India'
        };
      })
      .sort((a, b) => b.publishedAt - a.publishedAt);
  }

  /**
   * Detect category from content
   */
  detectCategory(article) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    if (text.match(/cricket|football|sports|ipl|match|olympics|tennis|fifa/)) return 'sports';
    if (text.match(/business|economy|market|stock|finance|rupee|investment|company/)) return 'business';
    if (text.match(/bollywood|entertainment|film|movie|actor|celebrity|music|netflix/)) return 'entertainment';
    if (text.match(/technology|tech|app|software|ai|internet|digital|startup|google|apple/)) return 'technology';
    if (text.match(/politics|government|minister|parliament|election|party|bjp|congress|modi/)) return 'politics';
    if (text.match(/health|medical|hospital|doctor|treatment|disease|covid|vaccine/)) return 'health';
    if (text.match(/world|global|international|country|nation|abroad|foreign/)) return 'world';
    
    return 'general';
  }

  /**
   * Generate unique ID
   */
  generateId(title) {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50);
    return `${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cache articles in Firestore (optional, non-blocking)
   */
  async cacheArticles(articles) {
    try {
      const newsRef = collection(db, 'news');
      
      for (const article of articles.slice(0, 5)) {
        try {
          await addDoc(newsRef, {
            ...article,
            publishedAt: Timestamp.fromDate(article.publishedAt),
            cachedAt: serverTimestamp()
          });
        } catch {
          break; // Stop if Firestore fails
        }
      }
    } catch {
      // Silently fail - caching is optional
    }
  }

  /**
   * Main method to get news with caching
   */
  async getNews(category = 'all') {
    const cacheKey = `news-${category}`;
    
    // Check memory cache (5 minutes)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        console.log('📦 Returning cached news for', category);
        return cached.data;
      }
    }

    // Fetch fresh data
    console.log('🔄 Fetching fresh news for', category);
    const articles = await this.fetchFromNewsAPI(category);
    
    // Update cache
    this.cache.set(cacheKey, {
      data: articles,
      timestamp: Date.now()
    });

    // Try to cache in Firestore (non-blocking)
    this.cacheArticles(articles).catch(() => {});

    return articles;
  }

  /**
   * Refresh news (clear cache and fetch)
   */
  async refreshNews(category = 'all') {
    const cacheKey = `news-${category}`;
    this.cache.delete(cacheKey);
    
    return await this.getNews(category);
  }
}

export default new NewsService();