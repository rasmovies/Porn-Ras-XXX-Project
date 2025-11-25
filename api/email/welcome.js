const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { validateBody } = require('../_helpers/validation');
const { handleError } = require('../_helpers/errorHandler');
const { sendWelcomeMail } = require('../../services/emailService');

/**
 * POST /api/email/welcome
 * Send welcome email
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
      { field: 'email', required: true, email: true },
      { field: 'name', required: true },
    ]);
    
    if (validation) {
      return res.status(422).json({ success: false, errors: validation.errors });
    }
    
    const { email, name } = req.body;
    
    // Send email
    await sendWelcomeMail({ email, name });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Welcome mail error:', error);
    return handleError(res, error, 'Mail gönderilemedi.');
  }
}


