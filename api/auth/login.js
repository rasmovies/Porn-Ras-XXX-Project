const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');
<<<<<<< HEAD

/**
 * POST /api/auth/login
 * Login with email or nickname
 * Since there's no password system, we just verify the user exists
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || req.headers.referrer;
=======
const { comparePassword } = require('../../lib/password');

/**
 * POST /api/auth/login
 * Login with email or username and password
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
>>>>>>> 82e70a2c60e81ff44aa79db350e19baf4f548571
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight
<<<<<<< HEAD
  const method = req.method || req.httpMethod || 'GET';
  if (method === 'OPTIONS' || req.method === 'OPTIONS' || req.httpMethod === 'OPTIONS') {
    console.log('✅ OPTIONS preflight request received');
=======
  if (req.method === 'OPTIONS') {
>>>>>>> 82e70a2c60e81ff44aa79db350e19baf4f548571
    return handleOptions(req, res);
  }
  
  // Only allow POST
<<<<<<< HEAD
  const hasRequestBody = req.body && (typeof req.body === 'object' || typeof req.body === 'string');
  const isPostRequest = method === 'POST' || req.httpMethod === 'POST' || hasRequestBody;
  
  if (!isPostRequest) {
    return res.status(405).json({ 
      success: false, 
      message: `Method not allowed. Expected POST, got ${method || req.httpMethod || 'undefined'}` 
    });
=======
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
>>>>>>> 82e70a2c60e81ff44aa79db350e19baf4f548571
  }
  
  try {
    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
<<<<<<< HEAD
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


=======
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
    
    // Debug: Log the username that will be returned
    console.log('🔍 Login: Profile found - username:', username);
    console.log('🔍 Login: Profile user_name type:', typeof username);
    console.log('🔍 Login: Profile user_name length:', username?.length);
    console.log('🔍 Login: Profile user_name trimmed:', username?.trim());
    
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

>>>>>>> 82e70a2c60e81ff44aa79db350e19baf4f548571

