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
  
  // Check if origin is allowed (pornras.com domain)
  const isPornrasDomain = origin && origin.includes('pornras.com');
  
  // Allow Vercel deployment URLs for development/testing
  // ras-projects-6ebe5a01 is the organization ID
  const isVercelDeployment = origin && (
    origin.includes('vercel.app') && 
    origin.includes('ras-projects-6ebe5a01')
  );
  
  // Set CORS headers - Only allow pornras.com domains and Vercel deployments
  if (isPornrasDomain || isVercelDeployment) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // In production, only allow pornras.com domains
    // For development, allow localhost
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    if (isLocalhost && process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Default to www.pornras.com for security
      res.setHeader('Access-Control-Allow-Origin', 'https://www.pornras.com');
    }
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

