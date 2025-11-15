const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { validateBody } = require('../_helpers/validation');
const { handleError } = require('../_helpers/errorHandler');
const { sendMarketingMail } = require('../../services/emailService');

/**
 * POST /api/email/marketing
 * Send marketing email
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
      { field: 'subject', required: true },
      { field: 'headline', required: true },
      { field: 'message', required: true },
      { field: 'recipients', required: true, array: true, arrayMinLength: 1 },
      { field: 'ctaUrl', url: true },
      { field: 'unsubscribeUrl', url: true },
    ]);
    
    if (validation) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }
    
    // Validate email addresses in recipients array
    const { recipients } = req.body;
    const { validateEmail } = require('../_helpers/validation');
    
    for (const email of recipients) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'recipients', message: 'All recipients must be valid emails' }],
        });
      }
    }
    
    const { subject, headline, message, ctaUrl, ctaLabel, unsubscribeUrl } = req.body;
    
    // Send email
    await sendMarketingMail({ recipients, subject, headline, message, ctaUrl, ctaLabel, unsubscribeUrl });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Marketing mail error:', error);
    return handleError(res, error, 'Mail gönderilemedi.');
  }
}

