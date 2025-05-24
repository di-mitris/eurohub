// src/lib/gnews.js - France + UK World News with Duplicate Detection

// Cache for the specific France/UK mix
let franceUkCache = {
  data: null,
  timestamp: null,
  ttl: 30 * 60 * 1000 // 30 minutes cache
};

export async function getFranceUKWorldNews() {
  // Check cache first
  if (franceUkCache.data && franceUkCache.timestamp && 
      (Date.now() - franceUkCache.timestamp) < franceUkCache.ttl) {
    console.log('📰 Using cached France/UK world news data');
    return franceUkCache.data;
  }

  const apiKey = process.env.GNEWS_API_KEY;
  
  if (!apiKey) {
    console.error('Missing GNEWS_API_KEY environment variable');
    return [];
  }

  try {
    console.log('🔄 Fetching world news from France and UK...');
    
    // Make 2 API calls: one for France, one for UK
    const [franceResponse, ukResponse] = await Promise.all([
      fetchWorldNews(apiKey, 'fr'),  // France
      fetchWorldNews(apiKey, 'gb')   // Great Britain
    ]);

    // Combine results
    const allArticles = [...franceResponse, ...ukResponse];
    console.log(`📊 Raw articles: ${franceResponse.length} from France, ${ukResponse.length} from UK`);

    // Remove duplicate stories about the same events
    const uniqueArticles = removeSimilarArticles(allArticles);
    console.log(`🔍 After similarity filtering: ${uniqueArticles.length} unique articles`);

    // Select top 5 with good mix from both countries
    const top5Articles = selectBalancedTop5(uniqueArticles);

    // Format for display
    const formattedArticles = top5Articles.map((article, index) => ({
      number: index + 1,
      title: article.title,
      author: article.source?.name || 'Unknown Source',
      link: article.url,
      publishedAt: article.publishedAt,
      country: article.sourceCountry,
      similarity: article.similarityScore || 0
    }));

    // Update cache
    franceUkCache.data = formattedArticles;
    franceUkCache.timestamp = Date.now();
    
    console.log(`✅ France/UK world news successful: ${formattedArticles.length} articles`);
    return formattedArticles;
    
  } catch (error) {
    console.error('France/UK world news error:', error);
    return franceUkCache.data || [];
  }
}

// Helper function to fetch world news from a specific country
async function fetchWorldNews(apiKey, country) {
  try {
    const url = new URL('https://gnews.io/api/v4/top-headlines');
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('lang', 'en');           // English language
    url.searchParams.append('country', country);     // France or UK
    url.searchParams.append('category', 'world');    // World news category
    url.searchParams.append('max', '10');            // Up to 10 articles per country

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error for ${country}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add source country to each article
    return (data.articles || []).map(article => ({
      ...article,
      sourceCountry: country.toUpperCase()
    }));
    
  } catch (error) {
    console.error(`Error fetching world news from ${country}:`, error);
    return [];
  }
}

// Advanced similarity detection to remove duplicate stories
function removeSimilarArticles(articles) {
  const uniqueArticles = [];
  const SIMILARITY_THRESHOLD = 0.6; // 60% similarity threshold

  for (const article of articles) {
    let isDuplicate = false;
    
    for (const existingArticle of uniqueArticles) {
      const similarity = calculateSimilarity(article.title, existingArticle.title);
      
      if (similarity > SIMILARITY_THRESHOLD) {
        console.log(`🔍 Duplicate detected (${Math.round(similarity * 100)}% similar):`);
        console.log(`   Original: "${existingArticle.title}"`);
        console.log(`   Duplicate: "${article.title}"`);
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      uniqueArticles.push(article);
    }
  }
  
  return uniqueArticles;
}

// Calculate similarity between two headlines using multiple methods
function calculateSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  // Normalize titles for comparison
  const normalize = (str) => str.toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
  
  const norm1 = normalize(title1);
  const norm2 = normalize(title2);
  
  // Method 1: Exact match
  if (norm1 === norm2) return 1.0;
  
  // Method 2: One title contains the other (substantial overlap)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length >= norm2.length ? norm1 : norm2;
    return shorter.length / longer.length;
  }
  
  // Method 3: Jaccard similarity (shared words)
  const words1 = new Set(norm1.split(' ').filter(word => word.length > 2));
  const words2 = new Set(norm2.split(' ').filter(word => word.length > 2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  
  // Method 4: Check for common key entities/topics
  const keyEntities = ['ukraine', 'russia', 'putin', 'trump', 'biden', 'china', 'israel', 'gaza', 'palestine'];
  const entities1 = keyEntities.filter(entity => norm1.includes(entity));
  const entities2 = keyEntities.filter(entity => norm2.includes(entity));
  
  let entityBonus = 0;
  if (entities1.length > 0 && entities2.length > 0) {
    const sharedEntities = entities1.filter(entity => entities2.includes(entity));
    entityBonus = sharedEntities.length > 0 ? 0.3 : 0; // Boost if same major entities
  }
  
  // Combine methods
  return Math.min(1.0, jaccardSimilarity + entityBonus);
}

// Select balanced top 5 ensuring good mix from both countries
function selectBalancedTop5(articles) {
  if (articles.length <= 5) return articles;
  
  // Separate by country
  const franceArticles = articles.filter(a => a.sourceCountry === 'FR');
  const ukArticles = articles.filter(a => a.sourceCountry === 'GB');
  
  console.log(`📊 Available: ${franceArticles.length} from France, ${ukArticles.length} from UK`);
  
  // Aim for balanced representation
  const top5 = [];
  
  // Take top 2-3 from each country if available
  if (franceArticles.length >= 2 && ukArticles.length >= 2) {
    // Balanced approach: 2-3 from each
    top5.push(...franceArticles.slice(0, 2));
    top5.push(...ukArticles.slice(0, 2));
    
    // Add one more from whichever has more articles
    if (franceArticles.length > ukArticles.length && franceArticles.length >= 3) {
      top5.push(franceArticles[2]);
    } else if (ukArticles.length >= 3) {
      top5.push(ukArticles[2]);
    }
  } else {
    // If one country has very few articles, just take the best available
    top5.push(...articles.slice(0, 5));
  }
  
  console.log(`🎯 Selected top 5: ${top5.filter(a => a.sourceCountry === 'FR').length} from France, ${top5.filter(a => a.sourceCountry === 'GB').length} from UK`);
  
  return top5.slice(0, 5);
}

// Export the main function (you can replace the current getTopGNewsHeadlines call with this)
export async function getTopGNewsHeadlines() {
  return await getFranceUKWorldNews();
}

// Clear cache function for France/UK data
export function clearFranceUKCache() {
  franceUkCache = { data: null, timestamp: null, ttl: 30 * 60 * 1000 };
  console.log('🗑️ France/UK news cache cleared');
}

// Utility function to manually test similarity
export function testSimilarity(title1, title2) {
  const similarity = calculateSimilarity(title1, title2);
  console.log(`Similarity between:\n"${title1}"\n"${title2}"\nScore: ${Math.round(similarity * 100)}%`);
  return similarity;
}