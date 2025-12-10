const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');

/**
 * POST /api/auth/login
 * Login with email or nickname
 * Since there's no password system, we just verify the user exists
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || req.headers.referrer;
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight
  const method = req.method || req.httpMethod || 'GET';
  if (method === 'OPTIONS' || req.method === 'OPTIONS' || req.httpMethod === 'OPTIONS') {
    console.log('✅ OPTIONS preflight request received');
    return handleOptions(req, res);
  }
  
  // Only allow POST
  const hasRequestBody = req.body && (typeof req.body === 'object' || typeof req.body === 'string');
  const isPostRequest = method === 'POST' || req.httpMethod === 'POST' || hasRequestBody;
  
  if (!isPostRequest) {
    return res.status(405).json({ 
      success: false, 
      message: `Method not allowed. Expected POST, got ${method || req.httpMethod || 'undefined'}` 
    });
  }
  
  try {
    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse body as JSON:', e);
      }
    }
    
    const { emailOrNickname } = body || {};
    console.log('📥 Login attempt for:', emailOrNickname);
    
    if (!emailOrNickname || !emailOrNickname.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or nickname is required' 
      });
    }
    
    const input = emailOrNickname.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    
    let profile = null;
    let email = null;
    let username = null;
    
    if (isEmail) {
      // Input is an email - find user by email in verification_codes table
      email = input;
      
      // Try to find username from verification_codes table (most recent)
      const { data: codeData, error: codeError } = await supabase
        .from('verification_codes')
        .select('username, email')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (codeData && codeData.username) {
        username = codeData.username;
        
        // Find profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_name', username)
          .maybeSingle();
        
        if (profileData) {
          profile = profileData;
        }
      } else {
        // Email not found in verification_codes, try to extract username from email
        username = email.split('@')[0];
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_name', username)
          .maybeSingle();
        
        if (profileData) {
          profile = profileData;
        }
      }
    } else {
      // Input is a nickname/username
      username = input;
      
      // Find profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_name', username)
        .maybeSingle();
      
      if (profileData) {
        profile = profileData;
        
        // Try to find email from verification_codes table
        const { data: codeData, error: codeError } = await supabase
          .from('verification_codes')
          .select('email')
          .eq('username', username)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (codeData && codeData.email) {
          email = codeData.email;
        }
      }
    }
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Please check your email or nickname and try again.' 
      });
    }
    
    // User found - return user data for login
    // Note: In a production system with passwords, you'd verify the password here
    const userData = {
      id: profile.id,
      username: profile.user_name,
      email: email || null,
      emailVerified: profile.email_verified || false,
    };
    
    console.log('✅ Login successful for:', username);
    
    return res.json({ 
      success: true, 
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return handleError(res, error, 'Failed to login. Please try again.');
  }
};


