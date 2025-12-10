const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');

/**
 * POST /api/metadata/scrape-model
 * Fetch metadata for a model name from external sources
 * 
 * This is a mock implementation. Replace with actual API integration later.
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || req.headers.referrer;
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight
  const method = req.method || req.httpMethod || 'GET';
  if (method === 'OPTIONS' || req.method === 'OPTIONS' || req.httpMethod === 'OPTIONS') {
    console.log('✅ OPTIONS preflight request received');
    return handleOptions(req, res);
  }
  
  // Only allow POST
  const hasRequestBody = req.body && (typeof req.body === 'object' || typeof req.body === 'string');
  const isPostRequest = method === 'POST' || req.httpMethod === 'POST' || hasRequestBody;
  
  if (!isPostRequest) {
    return res.status(405).json({ 
      success: false, 
      message: `Method not allowed. Expected POST, got ${method || req.httpMethod || 'undefined'}` 
    });
  }
  
  try {
    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse body as JSON:', e);
      }
    }
    
    const { modelName } = body || {};
    console.log('📥 Scraping metadata for model:', modelName);
    
    if (!modelName || !modelName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Model name is required' 
      });
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock metadata response
    // TODO: Replace with actual API integration (e.g., TMDB, adult model databases, etc.)
    const mockMetadata = generateMockMetadata(modelName.trim());
    
    return res.json({ 
      success: true, 
      metadata: mockMetadata 
    });
  } catch (error) {
    console.error('Scrape model metadata error:', error);
    return handleError(res, error, 'Failed to scrape model metadata.');
  }
};

/**
 * Generate mock metadata for a model
 * This function simulates fetching metadata from an external API
 * Replace this with actual API calls when integrating with a real metadata service
 */
function generateMockMetadata(modelName) {
  // Normalize model name for consistent results
  const normalizedName = modelName.toLowerCase().trim();
  
  // Mock data - In production, this would come from an external API
  const mockImages = [
    'https://via.placeholder.com/400x600/FF6B9D/FFFFFF?text=' + encodeURIComponent(modelName),
    'https://via.placeholder.com/400x600/C44569/FFFFFF?text=' + encodeURIComponent(modelName),
  ];
  
  // Generate some mock metadata based on name
  const mockMetadata = {
    name: modelName,
    image: mockImages[0],
    images: mockImages,
    description: `Professional performer and model. Known for her work in the adult entertainment industry.`,
    // Additional metadata fields can be added here
    // age: null,
    // country: null,
    // height: null,
    // weight: null,
    // measurements: null,
    // bio: null,
    // aliases: [],
    // tags: [],
    // socialLinks: {},
  };
  
  // Add some variation based on name to make it look more realistic
  if (normalizedName.includes('alex')) {
    mockMetadata.description = 'Award-winning performer known for versatile performances and professional dedication.';
    mockMetadata.images = [
      'https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Alex',
      'https://via.placeholder.com/400x600/45B7D1/FFFFFF?text=Alex',
    ];
    mockMetadata.image = mockMetadata.images[0];
  } else if (normalizedName.includes('sara')) {
    mockMetadata.description = 'Rising star with a growing fanbase. Specializes in high-quality productions.';
    mockMetadata.images = [
      'https://via.placeholder.com/400x600/FFA07A/FFFFFF?text=Sara',
      'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Sara',
    ];
    mockMetadata.image = mockMetadata.images[0];
  }
  
  return mockMetadata;
}



