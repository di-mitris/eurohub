// src/lib/gnews.js - Simple Production Version
// Updates every 12 hours with top 5 world news articles in English

// Global cache with 12-hour TTL
let newsCache = {
  data: null,
  timestamp: null,
  ttl: 12 * 60 * 60 * 1000 // 12 hours in milliseconds
};

// Countries known to have good English world news coverage
const RELIABLE_COUNTRIES = ['gb', 'us', 'au', 'ca', 'ie'];

export async function getTopGNewsHeadlines() {
  // Check if cache is still valid
  if (newsCache.data && newsCache.timestamp && 
      (Date.now() - newsCache.timestamp) < newsCache.ttl) {
    console.log('📰 Using cached news data (12-hour cache)');
    return newsCache.data;
  }

  const apiKey = process.env.GNEWS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Missing GNEWS_API_KEY environment variable');
    return [];
  }

  try {
    console.log('🔄 Fetching fresh world news...');
    
    // Try each country until we get good results
    let articles = [];
    for (const country of RELIABLE_COUNTRIES) {
      const countryArticles = await fetchCountryNews(apiKey, country);
      if (countryArticles.length > 0) {
        articles = articles.concat(countryArticles);
        console.log(`✅ Got ${countryArticles.length} articles from ${country.toUpperCase()}`);
        
        // Stop when we have enough articles
        if (articles.length >= 10) break;
      }
    }

    if (articles.length === 0) {
      console.warn('⚠️ No articles found from any country');
      return newsCache.data || []; // Return cached data if available
    }

    // Remove duplicates and select top 5
    const uniqueArticles = removeDuplicates(articles);
    const top5 = selectTop5(uniqueArticles);

    // Format for display
    const formattedArticles = top5.map((article, index) => ({
      number: index + 1,
      title: article.title,
      author: article.source?.name || 'Unknown Source',
      link: article.url,
      publishedAt: article.publishedAt,
      country: article.sourceCountry || 'Unknown'
    }));

    // Update cache
    newsCache.data = formattedArticles;
    newsCache.timestamp = Date.now();
    
    console.log(`✅ Successfully cached ${formattedArticles.length} articles`);
    return formattedArticles;
    
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    // Return cached data if available, otherwise empty array
    return newsCache.data || [];
  }
}

// Fetch news from a specific country
async function fetchCountryNews(apiKey, countryCode) {
  try {
    const url = new URL('https://gnews.io/api/v4/top-headlines');
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('country', countryCode);
    url.searchParams.append('category', 'world');
    url.searchParams.append('lang', 'en');
    url.searchParams.append('max', '5');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.warn(`⚠️ API error for ${countryCode}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const articles = data.articles || [];
    
    // Add country info to each article
    return articles.map(article => ({
      ...article,
      sourceCountry: countryCode.toUpperCase()
    }));
    
  } catch (error) {
    console.warn(`⚠️ Failed to fetch from ${countryCode}:`, error.message);
    return [];
  }
}

// Simple duplicate removal based on title similarity
function removeDuplicates(articles) {
  const unique = [];
  
  for (const article of articles) {
    const isDuplicate = unique.some(existing => 
      calculateSimilarity(article.title, existing.title) > 0.7
    );
    
    if (!isDuplicate) {
      unique.push(article);
    }
  }
  
  console.log(`🔍 Removed ${articles.length - unique.length} duplicates`);
  return unique;
}

// Simple similarity check
function calculateSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  const normalize = str => str.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  const words1 = normalize(title1).split(/\s+/);
  const words2 = normalize(title2).split(/\s+/);
  
  const set1 = new Set(words1.filter(w => w.length > 2));
  const set2 = new Set(words2.filter(w => w.length > 2));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

// Select top 5 articles based on recency and source quality
function selectTop5(articles) {
  if (articles.length <= 5) return articles;
  
  // Sort by publication date (most recent first)
  const sorted = articles.sort((a, b) => 
    new Date(b.publishedAt) - new Date(a.publishedAt)
  );
  
  return sorted.slice(0, 5);
}

// Clear cache manually
export function clearNewsCache() {
  newsCache = { data: null, timestamp: null, ttl: 12 * 60 * 60 * 1000 };
  console.log('🗑️ News cache cleared');
}

// Get cache status
export function getCacheStatus() {
  if (!newsCache.timestamp) {
    return { status: 'empty', message: 'No cached data' };
  }
  
  const ageHours = (Date.now() - newsCache.timestamp) / (1000 * 60 * 60);
  const isValid = ageHours < 12;
  
  return {
    status: isValid ? 'valid' : 'expired',
    ageHours: Math.round(ageHours * 10) / 10,
    nextUpdate: isValid ? `${Math.round((12 - ageHours) * 10) / 10} hours` : 'now',
    articleCount: newsCache.data?.length || 0
  };
}