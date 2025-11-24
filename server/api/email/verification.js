const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { validateBody } = require('../_helpers/validation');
const { handleError } = require('../_helpers/errorHandler');
const { sendVerificationMail } = require('../../services/emailService');

/**
 * POST /api/email/verification
 * Send email verification
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
    
    // Daha açıklayıcı hata mesajları
    let errorMessage = 'Mail gönderilemedi.';
    let statusCode = 500;
    
    if (error.code === 'EMAIL_CONFIG_MISSING' || error.code === 'EMAIL_AUTH_MISSING') {
      errorMessage = 'Email servisi yapılandırma hatası. Lütfen yöneticiyle iletişime geçin.';
      statusCode = 500;
    } else if (error.code === 'ESOCKET' || error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
      errorMessage = 'Email servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      statusCode = 503;
    } else if (error.code === 'EAUTH' || error.message?.includes('authentication failed') || error.message?.includes('Invalid login')) {
      errorMessage = 'Email servisi kimlik doğrulama hatası. Lütfen yöneticiyle iletişime geçin.';
      statusCode = 500;
    } else if (error.message) {
      errorMessage = `Mail gönderilemedi: ${error.message}`;
    }
    
    return res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      code: error.code || 'EMAIL_SEND_ERROR'
    });
  }
}

