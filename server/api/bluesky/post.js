const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { validateBody } = require('../_helpers/validation');
const { handleError } = require('../_helpers/errorHandler');
const { postToBluesky } = require('../../services/blueskyService');

/**
 * POST /api/bluesky/post
 * Post to Bluesky
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);
  
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
      { field: 'text', required: true },
      { field: 'imageUrl', url: true },
      { field: 'linkUrl', url: true },
    ]);
    
    if (validation) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }
    
    const { text, imageUrl, linkUrl } = req.body;
    
    // Post to Bluesky
    const result = await postToBluesky(text, imageUrl, linkUrl);
    
    return res.json({
      success: true,
      message: 'Bluesky\'de post yayınlandı',
      data: result,
    });
  } catch (error) {
    console.error('Bluesky post error:', error);
    return handleError(res, error, 'Bluesky post başarısız');
  }
}

