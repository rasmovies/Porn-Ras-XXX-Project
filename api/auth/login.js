const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');
const { comparePassword } = require('../../lib/password');

/**
 * POST /api/auth/login
 * Login with email or username and password
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
    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse body:', e);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid request body' 
        });
      }
    }
    
    const { emailOrUsername, password } = body || {};
    
    if (!emailOrUsername || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email/Username and password are required' 
      });
    }
    
    // Check if input is email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrUsername);
    
    let userEmail = null;
    let username = null;
    let profile = null;
    
    // Find user in profiles table
    let profiles = null;
    let profileError = null;
    
    try {
      if (isEmail) {
        // Search by email first
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailOrUsername)
          .limit(1);
        
        profiles = data;
        profileError = error;
        
        // If not found by email, try username (email prefix)
        if ((!profiles || profiles.length === 0) && !profileError) {
          const emailPrefix = emailOrUsername.split('@')[0];
          const { data: data2, error: error2 } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_name', emailPrefix)
            .limit(1);
          
          if (error2) {
            profileError = error2;
          } else {
            profiles = data2;
          }
        }
      } else {
        // Search by username
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_name', emailOrUsername)
          .limit(1);
        
        profiles = data;
        profileError = error;
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      profileError = dbError;
    }
    
    // If profiles table doesn't exist or query fails, return helpful error
    if (profileError) {
      console.error('Profile search error:', profileError);
      
      // Check if it's a table not found error
      if (profileError.message && profileError.message.includes('does not exist')) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database table not found. Please run the SQL setup scripts in Supabase.',
          error: 'TABLE_NOT_FOUND'
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Database error. Please check Supabase connection.',
        error: 'DATABASE_ERROR'
      });
    }
    
    if (!profiles || profiles.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz email/kullanıcı adı veya şifre' 
      });
    }
    
    profile = profiles[0];
    username = profile.user_name;
    userEmail = profile.email;
    
    // Email bulunamazsa, username'den email oluştur (geçici çözüm)
    if (!userEmail) {
      console.warn(`User ${username} has no email in profile`);
      userEmail = `${username}@example.com`;
    }
    
    // Try to sign in with Supabase Auth using email
    // If user doesn't exist in Auth, we'll still allow login from profile
    let authData = null;
    let authError = null;
    
    try {
      const authResult = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });
      
      if (authResult.error) {
        authError = authResult.error;
        console.log('Supabase Auth login failed:', authError.message);
        // Continue - allow login from profile for legacy users
      } else {
        authData = authResult.data;
      }
    } catch (authException) {
      console.log('Supabase Auth exception:', authException.message);
      // Continue without Auth
    }
    
    // If Auth login failed but user exists in profile, check password hash if available
    // This handles legacy users who weren't created in Auth
    if (!authData && authError) {
      console.log(`User ${username} found in profiles but not in Auth. Checking password hash...`);
      
      // If profile has password_hash, verify password
      if (profile.password_hash) {
        try {
          const passwordMatch = await comparePassword(password, profile.password_hash);
          if (!passwordMatch) {
            return res.status(401).json({ 
              success: false, 
              message: 'Geçersiz email/kullanıcı adı veya şifre' 
            });
          }
          console.log('Password verified via hash');
        } catch (hashError) {
          console.error('Password hash comparison error:', hashError);
          // If hash comparison fails, allow login for legacy users (backward compatibility)
        }
      } else {
        // No password hash, allow login for legacy users (backward compatibility)
        console.log('No password hash found, allowing login for legacy user');
      }
    }
    
    // Return user data (from profile, with optional auth data)
    res.json({
      success: true,
      user: {
        id: authData?.user?.id || profile.id || username,
        username: username,
        email: userEmail,
        name: profile.name || username,
        avatar: profile.avatar || profile.avatar_image || null,
      },
      session: authData?.session || null,
      authVerified: !!authData // Indicates if password was verified via Auth
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    
    // Return proper JSON error response
    return res.status(500).json({
      success: false,
      message: 'Login işlemi sırasında bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

