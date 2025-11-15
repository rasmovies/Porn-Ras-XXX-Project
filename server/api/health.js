const { setCorsHeaders, handleOptions } = require('./_helpers/cors');

/**
 * GET /api/health
 * Health check endpoint
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  return res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
}

