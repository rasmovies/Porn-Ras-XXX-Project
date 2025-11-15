/**
 * CORS helper for Vercel API Routes
 * Sets CORS headers for all requests
 * Allows all pornras.com subdomains (www.pornras.com, pornras.com, api.pornras.com, etc.)
 */
function setCorsHeaders(res, origin) {
  // Allow all pornras.com subdomains
  const allowedOrigins = [
    'https://www.pornras.com',
    'https://pornras.com',
    'https://api.pornras.com',
  ];
  
  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.some(allowed => origin.includes('pornras.com'));
  
  // Set CORS headers
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default to www.pornras.com for security
    res.setHeader('Access-Control-Allow-Origin', 'https://www.pornras.com');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('Access-Control-Allow-Credentials', 'false');
}

/**
 * Handle OPTIONS preflight requests
 */
function handleOptions(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  setCorsHeaders(res, origin);
  res.status(200).end();
}

module.exports = { setCorsHeaders, handleOptions };

