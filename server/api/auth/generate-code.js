const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');
const { sendVerificationMail } = require('../../services/emailService');

/**
 * POST /api/auth/generate-code
 * Generate 6-digit verification code and send via email
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
    const { email, username } = req.body;
    
    if (!email || !username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and username are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Code expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Store code in Supabase (verification_codes table)
    // Try to find existing unused code
    let codeData;
    try {
      const { data: existingCode, error: findError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (existingCode && !findError) {
        // Update existing code
        const { data, error } = await supabase
          .from('verification_codes')
          .update({
            code: verificationCode,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
          })
          .eq('id', existingCode.id)
          .select()
          .single();
        
        if (error) throw error;
        codeData = data;
      } else {
        // Create new code
        const { data, error } = await supabase
          .from('verification_codes')
          .insert({
            email: email,
            username: username,
            code: verificationCode,
            expires_at: expiresAt,
            is_used: false
          })
          .select()
          .single();
        
        if (error) {
          // If table doesn't exist, log warning but continue
          console.warn('⚠️ verification_codes table not found. Code will be sent but not stored. Please create the table in Supabase.');
          console.warn('Table structure needed: verification_codes (id, email, username, code, expires_at, is_used, created_at)');
          codeData = { code: verificationCode, email, username, expires_at: expiresAt };
        } else {
          codeData = data;
        }
      }
    } catch (dbError) {
      // If database operation fails, still send email
      console.warn('⚠️ Database error, but continuing with email send:', dbError.message);
      codeData = { code: verificationCode, email, username, expires_at: expiresAt };
    }
    
    // Send verification email with code
    try {
      await sendVerificationMail({ 
        email, 
        username, 
        verificationCode: verificationCode 
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails, but log it
    }
    
    return res.json({ 
      success: true, 
      message: 'Verification code sent successfully',
      // Don't send code to client for security
    });
  } catch (error) {
    console.error('Generate code error:', error);
    return handleError(res, error, 'Failed to generate verification code.');
  }
};

