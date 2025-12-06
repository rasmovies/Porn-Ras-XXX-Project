const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');

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
    const { emailOrUsername, password } = req.body;
    
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
    
    if (isEmail) {
      userEmail = emailOrUsername;
      // Find user by email in profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${userEmail},user_name.eq.${userEmail.split('@')[0]}`)
        .limit(1);
      
      if (profileError) {
        throw new Error('Failed to find user: ' + profileError.message);
      }
      
      if (!profiles || profiles.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email/username or password' 
        });
      }
      
      username = profiles[0].user_name;
      userEmail = profiles[0].email || userEmail;
    } else {
      username = emailOrUsername;
      // Find user by username in profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_name', username)
        .limit(1);
      
      if (profileError) {
        throw new Error('Failed to find user: ' + profileError.message);
      }
      
      if (!profiles || profiles.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email/username or password' 
        });
      }
      
      userEmail = profiles[0].email;
    }
    
    // Try to sign in with Supabase Auth using email
    if (!userEmail) {
      return res.status(401).json({ 
        success: false, 
        message: 'User email not found' 
      });
    }
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });
    
    if (authError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email/username or password' 
      });
    }
    
    // Get user profile
    const { data: profile, error: profileError2 } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_name', username)
      .single();
    
    if (profileError2) {
      console.error('Profile fetch error:', profileError2);
    }
    
    // Return user data
    res.json({
      success: true,
      user: {
        id: authData.user.id,
        username: username,
        email: userEmail,
        name: profile?.name || username,
        avatar: profile?.avatar || null,
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Login error:', error);
    return handleError(res, error, 'Login failed');
  }
};

