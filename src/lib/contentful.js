import { createClient } from "contentful";

// Try environment variables first, fallback to hardcoded for development
const spaceId = process.env.CONTENTFUL_SPACE_ID || "placehldr";
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN || "placehldr";

console.log('Contentful config:', {
  spaceId: spaceId ? 'SET' : 'MISSING',
  accessToken: accessToken ? 'SET' : 'MISSING',
  usingEnv: !!process.env.CONTENTFUL_SPACE_ID
});

const client = createClient({
  space: spaceId,
  accessToken: accessToken,
});

export async function getHeadlines() {
  try {
    console.log('Attempting to fetch from Contentful...');
    
    // First, let's see what content types exist
    const contentTypes = await client.getContentTypes();
    console.log('Available content types:', contentTypes.items.map(ct => ({ id: ct.sys.id, name: ct.name })));
    
    // Try to get all entries first to see what's available
    const allEntries = await client.getEntries({ limit: 10 });
    console.log('All entries sample:', allEntries.items.map(item => ({ 
      id: item.sys.id, 
      contentType: item.sys.contentType.sys.id,
      fields: Object.keys(item.fields)
    })));
    
    // Now try to get entries with the specific content type
    const response = await client.getEntries({
      content_type: "headlines", // Make sure this matches your Contentful content type ID
      order: "-sys.createdAt", // Sort by creation date instead of fields.date
      limit: 20
    });

    console.log('Contentful headlines response:', response);
    console.log('Number of headlines found:', response.items.length);

    if (response.items.length === 0) {
      console.warn('No headlines found. Check if content type "headlines" exists and has published entries.');
      return [];
    }

    // Transform data into a usable format
    return response.items.map((item) => {
      console.log('Processing item:', item.fields);
      return {
        title: item.fields.title || 'No Title',
        author: item.fields.author || 'Unknown Author',
        link: item.fields.url || item.fields.link || '#',
        date: item.fields.date || item.sys.createdAt,
      };
    });
  } catch (error) {
    console.error('Contentful API error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      response: error.response?.data
    });
    
    // Return empty array instead of throwing
    return [];
  }
}