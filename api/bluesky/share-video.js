const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { validateBody } = require('../_helpers/validation');
const { handleError } = require('../_helpers/errorHandler');
const { shareVideoToBluesky } = require('../../services/blueskyService');

/**
 * POST /api/bluesky/share-video
 * Share video to Bluesky
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Check if Bluesky credentials are configured
    if (!process.env.BLUESKY_HANDLE || !process.env.BLUESKY_PASSWORD) {
      console.error('❌ Bluesky credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Bluesky credentials not configured',
        error: 'BLUESKY_HANDLE and BLUESKY_PASSWORD environment variables are required',
      });
    }

    // Validation
    const validation = validateBody(req.body, [
      { field: 'title', required: true },
      { field: 'slug', required: true },
      { field: 'thumbnail', url: true },
      { field: 'description', required: false },
    ]);
    
    if (validation) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }
    
    const { title, description, thumbnail, slug, modelName, categoryName } = req.body;
    
    console.log('📤 Bluesky share request:', {
      title,
      slug,
      hasThumbnail: !!thumbnail,
      hasDescription: !!description,
      modelName,
      categoryName,
    });
    
    // Share to Bluesky
    const result = await shareVideoToBluesky({
      title,
      description,
      thumbnail,
      slug,
      modelName,
      categoryName,
    });
    
    console.log('✅ Bluesky share successful:', result);
    
    return res.json({
      success: true,
      message: 'Video Bluesky\'de paylaşıldı',
      data: result,
    });
  } catch (error) {
    console.error('❌ Bluesky share video error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return more detailed error information
    return res.status(500).json({
      success: false,
      message: 'Bluesky paylaşımı başarısız',
      error: error.message || 'Unknown error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error.toString(),
      }),
    });
  }
}

