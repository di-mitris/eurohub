// src/lib/gnews.js - Optimized version with caching and European focus

// In-memory cache to reduce API calls
let cache = {
  data: null,
  timestamp: null,
  ttl: 30 * 60 * 1000 // 30 minutes cache
};

export async function getTopGNewsHeadlines() {
  // Check cache first
  if (cache.data && cache.timestamp && (Date.now() - cache.timestamp) < cache.ttl) {
    console.log('📰 Using cached GNews data');
    return cache.data;
  }

  const apiKey = process.env.GNEWS_API_KEY;
  
  if (!apiKey) {
    console.error('Missing GNEWS_API_KEY environment variable');
    return [];
  }
  
  // European countries for focused news
  const europeanCountries = ['gb', 'de', 'fr', 'it', 'es', 'pl', 'nl', 'be', 'se', 'no'];
  const randomCountry = europeanCountries[Math.floor(Math.random() * europeanCountries.length)];
  
  try {
    console.log(`🔄 Making GNews API call for country: ${randomCountry}`);
    
    // Optimized GNews API call with European focus
    const url = new URL('https://gnews.io/api/v4/top-headlines');
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('lang', 'en');                    // English only
    url.searchParams.append('country', randomCountry);        // Focus on European countries
    url.searchParams.append('max', '10');                     // Increased from 5 to 10
    url.searchParams.append('nullable', 'description,content'); // Allow null values
    // You can add these optional filters:
    // url.searchParams.append('q', 'Europe OR European OR EU'); // European keywords only
    // url.searchParams.append('exclude', 'sports,entertainment'); // Exclude categories
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`GNews API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.articles) {
      console.warn('No articles returned from GNews API');
      return cache.data || []; // Return cached data if available
    }

    const articles = data.articles.map((article, index) => ({
      number: index + 1,
      title: article.title,
      author: article.source?.name || 'Unknown Source',
      link: article.url,
      publishedAt: article.publishedAt,
      country: randomCountry.toUpperCase()
    }));

    // Update cache
    cache.data = articles;
    cache.timestamp = Date.now();
    
    console.log(`✅ GNews API successful: ${articles.length} articles cached`);
    return articles;
    
  } catch (error) {
    console.error('GNews API error:', error);
    
    // Return cached data if available, otherwise empty array
    if (cache.data) {
      console.log('📰 API failed, using cached data');
      return cache.data;
    }
    
    return [];
  }
}

// Optional: Function to get news with specific European keywords
export async function getEuropeanNews(keywords = 'Europe OR European OR EU') {
  const apiKey = process.env.GNEWS_API_KEY;
  
  if (!apiKey) {
    console.error('Missing GNEWS_API_KEY environment variable');
    return [];
  }

  try {
    const url = new URL('https://gnews.io/api/v4/search');
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('q', keywords);
    url.searchParams.append('lang', 'en');
    url.searchParams.append('max', '5');
    url.searchParams.append('sortby', 'publishedAt'); // Most recent first
    url.searchParams.append('from', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 24 hours
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!data.articles) return [];
    
    return data.articles.map((article, index) => ({
      number: index + 1,
      title: article.title,
      author: article.source?.name || 'Unknown Source',
      link: article.url,
      publishedAt: article.publishedAt
    }));
    
  } catch (error) {
    console.error('European news search error:', error);
    return [];
  }
}

// Clear cache function (useful for testing)
export function clearNewsCache() {
  cache = { data: null, timestamp: null, ttl: 30 * 60 * 1000 };
  console.log('🗑️ News cache cleared');
}