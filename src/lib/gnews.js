// src/lib/gnews.js - Enhanced 4-Country European World News with Random Selection

// Cache for the European 4-country mix
let europeanCache = {
  data: null,
  timestamp: null,
  ttl: 60 * 60 * 1000 // 1 hour cache (3600 seconds)
};

// Country configuration with proper display names and codes
const EUROPEAN_COUNTRIES = {
  'fr': { name: 'France', flag: '🇫🇷', displayCode: 'FR' },
  'de': { name: 'Germany', flag: '🇩🇪', displayCode: 'DE' },
  'it': { name: 'Italy', flag: '🇮🇹', displayCode: 'IT' },
  'es': { name: 'Spain', flag: '🇪🇸', displayCode: 'ES' }
};

export async function getFourCountryEuropeanNews() {
  // Check cache first - only refresh every hour
  if (europeanCache.data && europeanCache.timestamp && 
      (Date.now() - europeanCache.timestamp) < europeanCache.ttl) {
    console.log('📰 Using cached European news data (1-hour cache)');
    return { ...europeanCache.data, fromCache: true };
  }

  const apiKey = process.env.GNEWS_API_KEY;
  
  if (!apiKey) {
    console.error('Missing GNEWS_API_KEY environment variable');
    return [];
  }

  try {
    console.log('🔄 Fetching world news from 4 European countries...');
    
    // Make 4 parallel API calls for France, Germany, Italy, Spain
    const countryPromises = Object.keys(EUROPEAN_COUNTRIES).map(countryCode => 
      fetchWorldNews(apiKey, countryCode)
    );
    
    const countryResults = await Promise.all(countryPromises);
    
    // Combine all results and add country metadata
    const allArticles = [];
    countryResults.forEach((articles, index) => {
      const countryCode = Object.keys(EUROPEAN_COUNTRIES)[index];
      const countryInfo = EUROPEAN_COUNTRIES[countryCode];
      
      articles.forEach(article => {
        allArticles.push({
          ...article,
          sourceCountry: countryCode.toUpperCase(),
          countryInfo: countryInfo,
          // Add a unique identifier for tracking
          uniqueId: `${countryCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      });
    });

    console.log(`📊 Raw articles collected:`);
    Object.keys(EUROPEAN_COUNTRIES).forEach(code => {
      const count = allArticles.filter(a => a.sourceCountry === code.toUpperCase()).length;
      console.log(`  ${EUROPEAN_COUNTRIES[code].flag} ${EUROPEAN_COUNTRIES[code].name}: ${count} articles`);
    });

    // Remove duplicate stories about the same events
    const uniqueArticles = removeSimilarArticles(allArticles);
    console.log(`🔍 After similarity filtering: ${uniqueArticles.length} unique articles from ${allArticles.length} total`);

    // Randomly select 5 articles ensuring good distribution
    const randomTop5 = selectRandomBalancedTop5(uniqueArticles);

    // Format for display with proper country tagging
    const formattedArticles = randomTop5.map((article, index) => ({
      number: index + 1,
      title: article.title,
      author: article.source?.name || 'Unknown Source',
      link: article.url,
      publishedAt: article.publishedAt,
      country: article.countryInfo.displayCode, // Use proper display code (FR, DE, IT, ES)
      countryName: article.countryInfo.name,
      countryFlag: article.countryInfo.flag,
      similarity: article.similarityScore || 0,
      uniqueId: article.uniqueId
    }));

    // Update cache with current timestamp
    const result = {
      articles: formattedArticles,
      lastUpdated: new Date().toISOString(),
      totalSourceArticles: allArticles.length,
      uniqueAfterFiltering: uniqueArticles.length,
      fromCache: false
    };

    europeanCache.data = result;
    europeanCache.timestamp = Date.now();
    
    console.log(`✅ European 4-country news successful: ${formattedArticles.length} articles selected`);
    console.log(`🎯 Final distribution: ${formattedArticles.map(a => a.countryFlag + a.country).join(', ')}`);
    
    return result;
    
  } catch (error) {
    console.error('European 4-country news error:', error);
    // Return cached data if available, otherwise empty array
    return europeanCache.data?.articles || [];
  }
}

// Helper function to fetch world news from a specific country
async function fetchWorldNews(apiKey, countryCode) {
  try {
    const url = new URL('https://gnews.io/api/v4/top-headlines');
    url.searchParams.append('apikey', apiKey);
    url.searchParams.append('lang', 'en');           // English language
    url.searchParams.append('country', countryCode); // fr, de, it, es
    url.searchParams.append('category', 'world');    // World news category
    url.searchParams.append('max', '10');            // 10 articles per country

    console.log(`🌍 Fetching from ${EUROPEAN_COUNTRIES[countryCode].name} (${countryCode})...`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error for ${countryCode}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ ${EUROPEAN_COUNTRIES[countryCode].flag} ${EUROPEAN_COUNTRIES[countryCode].name}: ${data.articles?.length || 0} articles fetched`);
    
    return data.articles || [];
    
  } catch (error) {
    console.error(`❌ Error fetching world news from ${countryCode}:`, error);
    return [];
  }
}

// Enhanced similarity detection to remove duplicate stories
function removeSimilarArticles(articles) {
  const uniqueArticles = [];
  const SIMILARITY_THRESHOLD = 0.65; // Slightly higher threshold for better filtering
  
  console.log('🔍 Starting similarity analysis...');

  for (const article of articles) {
    let isDuplicate = false;
    let maxSimilarity = 0;
    let duplicateOf = null;
    
    for (const existingArticle of uniqueArticles) {
      const similarity = calculateSimilarity(article.title, existingArticle.title);
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        duplicateOf = existingArticle;
      }
      
      if (similarity > SIMILARITY_THRESHOLD) {
        console.log(`🔍 Duplicate detected (${Math.round(similarity * 100)}% similar):`);
        console.log(`   Original: "${existingArticle.title}" [${existingArticle.countryInfo.flag}${existingArticle.countryInfo.name}]`);
        console.log(`   Duplicate: "${article.title}" [${article.countryInfo.flag}${article.countryInfo.name}]`);
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      // Add similarity score for debugging
      article.similarityScore = maxSimilarity;
      uniqueArticles.push(article);
    }
  }
  
  console.log(`📊 Similarity filtering complete: ${uniqueArticles.length} unique from ${articles.length} total`);
  return uniqueArticles;
}

// Enhanced similarity calculation with multiple methods
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
  
  // Method 3: Jaccard similarity (shared words) - enhanced
  const words1 = new Set(norm1.split(' ').filter(word => word.length > 2));
  const words2 = new Set(norm2.split(' ').filter(word => word.length > 2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  
  // Method 4: Enhanced entity matching
  const keyEntities = [
    'ukraine', 'russia', 'putin', 'trump', 'biden', 'china', 'israel', 'gaza', 'palestine',
    'nato', 'eu', 'europe', 'brexit', 'covid', 'climate', 'economy', 'election'
  ];
  
  const entities1 = keyEntities.filter(entity => norm1.includes(entity));
  const entities2 = keyEntities.filter(entity => norm2.includes(entity));
  
  let entityBonus = 0;
  if (entities1.length > 0 && entities2.length > 0) {
    const sharedEntities = entities1.filter(entity => entities2.includes(entity));
    entityBonus = sharedEntities.length > 0 ? 0.25 : 0;
  }
  
  // Method 5: Length-based similarity boost for very different lengths
  const lengthRatio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
  const lengthPenalty = lengthRatio < 0.5 ? 0.1 : 0; // Penalize very different lengths
  
  // Combine methods
  return Math.min(1.0, jaccardSimilarity + entityBonus - lengthPenalty);
}

// Random selection with balanced country representation
function selectRandomBalancedTop5(articles) {
  if (articles.length <= 5) {
    console.log('🎲 Fewer than 5 unique articles available, returning all');
    return articles;
  }
  
  // Group by country
  const articlesByCountry = {};
  Object.keys(EUROPEAN_COUNTRIES).forEach(code => {
    articlesByCountry[code.toUpperCase()] = articles.filter(a => a.sourceCountry === code.toUpperCase());
  });
  
  console.log('📊 Available articles by country:');
  Object.entries(articlesByCountry).forEach(([code, arts]) => {
    const countryInfo = EUROPEAN_COUNTRIES[code.toLowerCase()];
    console.log(`  ${countryInfo.flag} ${countryInfo.name}: ${arts.length} articles`);
  });
  
  // Strategy: Try to get at least 1 from each country if possible, then random selection
  const selected = [];
  const remaining = [...articles];
  
  // First pass: Try to get one from each country
  Object.keys(EUROPEAN_COUNTRIES).forEach(code => {
    const countryArticles = remaining.filter(a => a.sourceCountry === code.toUpperCase());
    if (countryArticles.length > 0 && selected.length < 5) {
      const randomIndex = Math.floor(Math.random() * countryArticles.length);
      const selectedArticle = countryArticles[randomIndex];
      selected.push(selectedArticle);
      
      // Remove from remaining
      const remainingIndex = remaining.findIndex(a => a.uniqueId === selectedArticle.uniqueId);
      if (remainingIndex > -1) {
        remaining.splice(remainingIndex, 1);
      }
      
      console.log(`🎯 Selected from ${selectedArticle.countryInfo.flag}${selectedArticle.countryInfo.name}: "${selectedArticle.title.substring(0, 50)}..."`);
    }
  });
  
  // Second pass: Fill remaining slots randomly
  while (selected.length < 5 && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    const selectedArticle = remaining[randomIndex];
    selected.push(selectedArticle);
    remaining.splice(randomIndex, 1);
    
    console.log(`🎲 Randomly selected: "${selectedArticle.title.substring(0, 50)}..." [${selectedArticle.countryInfo.flag}${selectedArticle.countryInfo.name}]`);
  }
  
  // Final shuffle for extra randomness
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  
  console.log(`🎯 Final random selection complete: ${selected.length} articles`);
  
  return selected;
}

// Main export function (replaces getTopGNewsHeadlines)
export async function getTopGNewsHeadlines() {
  const result = await getFourCountryEuropeanNews();
  // Return just the articles array for backward compatibility
  return Array.isArray(result) ? result : result.articles || [];
}

// Export the detailed function for advanced usage
export { getFourCountryEuropeanNews };

// Clear cache function
export function clearEuropeanCache() {
  europeanCache = { data: null, timestamp: null, ttl: 60 * 60 * 1000 };
  console.log('🗑️ European news cache cleared');
}

// Legacy function name for compatibility
export function clearFranceUKCache() {
  clearEuropeanCache();
}

// Updated cache clearing function name
export function clearNewsCache() {
  clearEuropeanCache();
}

// Utility function to manually test similarity
export function testSimilarity(title1, title2) {
  const similarity = calculateSimilarity(title1, title2);
  console.log(`Similarity between:\n"${title1}"\n"${title2}"\nScore: ${Math.round(similarity * 100)}%`);
  return similarity;
}

// Debug function to see current cache status
export function getCacheStatus() {
  const now = Date.now();
  const cacheAge = europeanCache.timestamp ? now - europeanCache.timestamp : null;
  const cacheValid = cacheAge && cacheAge < europeanCache.ttl;
  
  return {
    hasCachedData: !!europeanCache.data,
    cacheTimestamp: europeanCache.timestamp ? new Date(europeanCache.timestamp).toISOString() : null,
    cacheAgeMinutes: cacheAge ? Math.round(cacheAge / (1000 * 60)) : null,
    cacheValid: cacheValid,
    ttlMinutes: Math.round(europeanCache.ttl / (1000 * 60))
  };
}