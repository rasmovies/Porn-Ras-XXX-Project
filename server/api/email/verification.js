const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { validateBody } = require('../_helpers/validation');
const { handleError } = require('../_helpers/errorHandler');
const { sendVerificationMail } = require('../../services/emailService');

/**
 * POST /api/email/verification
 * Send email verification
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
      { field: 'email', required: true, email: true },
      { field: 'username', required: true },
      { field: 'verifyUrl', required: true, url: true },
    ]);
    
    if (validation) {
      return res.status(422).json({ success: false, errors: validation.errors });
    }
    
    const { email, username, verifyUrl } = req.body;
    
    // Send email
    await sendVerificationMail({ email, username, verifyUrl });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Verification mail error:', error);
    return handleError(res, error, 'Mail gönderilemedi.');
  }
}

