const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');

/**
 * POST /api/auth/register
 * Register new user - create in both Supabase Auth and profiles table
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
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email and password are required' 
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
    
    // Check if username already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('user_name')
      .eq('user_name', username)
      .limit(1);
    
    if (checkError) {
      console.error('Profile check error:', checkError);
    }
    
    if (existingProfile && existingProfile.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .limit(1);
    
    if (emailCheckError) {
      console.error('Email check error:', emailCheckError);
    }
    
    if (existingEmail && existingEmail.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Step 1: Create user in Supabase Auth
    let authUser = null;
    let authError = null;
    
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
            name: username
          }
        }
      });
      
      if (authErr) {
        authError = authErr;
        console.error('Supabase Auth signup error:', authErr);
        // Continue anyway - we'll create profile without auth
      } else {
        authUser = authData.user;
      }
    } catch (authException) {
      console.error('Supabase Auth exception:', authException);
      // Continue anyway
    }
    
    // Step 2: Create profile in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_name: username,
        email: email,
        name: username,
        subscriber_count: 0,
        videos_watched: 0,
        email_verified: false, // Will be set to true after email verification
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // If auth user was created but profile failed, try to clean up
      if (authUser && authUser.id) {
        try {
          // Note: We can't delete auth user from server-side with anon key
          // This would need service_role key
          console.warn('Auth user created but profile failed. Manual cleanup may be needed.');
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create user profile' 
      });
    }
    
    // Return success
    res.json({
      success: true,
      user: {
        id: authUser?.id || profile.id,
        username: username,
        email: email,
        name: username,
        avatar: null,
      },
      profile: profile,
      authCreated: !!authUser,
      message: authUser 
        ? 'User registered successfully. Please verify your email.' 
        : 'User profile created. Auth user creation failed, but you can still login with email/username.'
    });
  } catch (error) {
    console.error('Register error:', error);
    return handleError(res, error, 'Registration failed');
  }
};

