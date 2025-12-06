const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');
const { sendVerificationMail } = require('../../services/emailService');

/**
 * POST /api/auth/verify
 * Two modes:
 * 1. Generate verification code: { email, username, action: 'generate' }
 * 2. Verify email with token: { token, email }
 */
module.exports = async function handler(req, res) {
  // Debug: Log request details
  console.log('🔍 /api/auth/verify called:', {
    method: req.method,
    url: req.url,
    path: req.path || req.url,
    headers: req.headers
  });
  
  const origin = req.headers.origin || req.headers.referer;
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false, 
      message: `Method not allowed. Expected POST, got ${req.method}` 
    });
  }
  
  try {
    const { email, username, action, token } = req.body;
    
    // Mode 1: Generate verification code
    if (action === 'generate' || (email && username && !token)) {
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
            console.warn('⚠️ verification_codes table not found. Code will be sent but not stored.');
            codeData = { code: verificationCode, email, username, expires_at: expiresAt };
          } else {
            codeData = data;
          }
        }
      } catch (dbError) {
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
      }
      
      return res.json({ 
        success: true, 
        message: 'Verification code sent successfully'
      });
    }
    
    // Mode 2: Verify with token (original functionality)
    if (!token || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and email are required' 
      });
    }
    
    // TODO: Token validation logic (check if token is valid and not expired)
    // For now, we'll just verify the email format and update the user
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    // Extract username from email (before @)
    // Note: In production, you should store username separately or use a token-based lookup
    const username = email.split('@')[0];
    
    // Update user's email_verified status in Supabase
    // First try to find by email if there's an email field, otherwise use username
    const { data: profiles, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_name', username)
      .limit(1);
    
    if (findError) {
      throw new Error('Failed to find user: ' + findError.message);
    }
    
    if (!profiles || profiles.length === 0) {
      // User doesn't exist, create a basic profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_name: username,
          email_verified: true,
          subscriber_count: 0,
          videos_watched: 0,
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error('Failed to create profile: ' + createError.message);
      }
      
      return res.json({ 
        success: true, 
        message: 'Email verified successfully',
        profile: newProfile
      });
    }
    
    // Update existing profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_name', username)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase update error:', updateError);
      // If user doesn't exist, create a basic profile
      if (updateError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_name: username,
            email_verified: true,
            subscriber_count: 0,
            videos_watched: 0,
          })
          .select()
          .single();
        
        if (createError) {
          throw new Error('Failed to create profile: ' + createError.message);
        }
        
        return res.json({ 
          success: true, 
          message: 'Email verified successfully',
          profile: newProfile
        });
      }
      
      throw updateError;
    }
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Email verified successfully',
      profile
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return handleError(res, error, 'Email verification failed.');
  }
};

