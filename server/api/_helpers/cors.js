/**
 * CORS helper for Vercel API Routes
 * Sets CORS headers for all requests
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.pornras.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Handle OPTIONS preflight requests
 */
function handleOptions(req, res) {
  setCorsHeaders(res);
  res.status(200).end();
}

module.exports = { setCorsHeaders, handleOptions };

