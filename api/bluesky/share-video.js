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
    
    const { title, description, thumbnail, slug } = req.body;
    
    // Share to Bluesky
    const result = await shareVideoToBluesky({
      title,
      description,
      thumbnail,
      slug,
    });
    
    return res.json({
      success: true,
      message: 'Video Bluesky\'de paylaşıldı',
      data: result,
    });
  } catch (error) {
    console.error('Bluesky share video error:', error);
    return handleError(res, error, 'Bluesky paylaşımı başarısız');
  }
}

