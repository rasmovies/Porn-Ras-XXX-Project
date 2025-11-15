/**
 * Error handler helper for Vercel API Routes
 */
function handleError(res, error, defaultMessage = 'Internal server error') {
  console.error('API Error:', error);
  
  const status = error.status || error.statusCode || 500;
  const message = error.message || defaultMessage;
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

module.exports = { handleError };

