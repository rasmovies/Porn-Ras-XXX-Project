const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { validateBody } = require('../_helpers/validation');
const { handleError } = require('../_helpers/errorHandler');
const { sendInviteMail } = require('../../services/emailService');

/**
 * POST /api/email/invite
 * Send invite email
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
      { field: 'inviterName', required: true },
      { field: 'inviteeEmail', required: true, email: true },
      { field: 'inviteUrl', required: true, url: true },
    ]);
    
    if (validation) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }
    
    const { inviterName, inviteeEmail, inviteUrl } = req.body;
    
    // Send email
    await sendInviteMail({ inviterName, inviteeEmail, inviteUrl });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Invite mail error:', error);
    return handleError(res, error, 'Mail gönderilemedi.');
  }
}

