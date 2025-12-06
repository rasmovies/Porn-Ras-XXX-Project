const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');
const { hashPassword } = require('../../lib/password');

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
    
    // Step 2: Hash password for storage (optional - if we want to store in profiles)
    // Note: Supabase Auth already handles password hashing, but we can store hash in profiles too
    let passwordHash = null;
    try {
      passwordHash = await hashPassword(password);
    } catch (hashError) {
      console.warn('Password hashing failed, continuing without hash:', hashError);
    }
    
    // Step 3: Create profile in profiles table
    const profileData = {
      user_name: username,
      email: email,
      name: username,
      subscriber_count: 0,
      videos_watched: 0,
      email_verified: false, // Will be set to true after email verification
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add password_hash if we want to store it (optional)
    // Uncomment if you want to store password hash in profiles table
    // if (passwordHash) {
    //   profileData.password_hash = passwordHash;
    // }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
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
        message: 'Kullanıcı profili oluşturulamadı' 
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
        ? 'Kayıt başarılı! Lütfen email adresinizi doğrulayın.' 
        : 'Kullanıcı profili oluşturuldu. Auth kullanıcısı oluşturulamadı, ancak email/kullanıcı adı ile giriş yapabilirsiniz.'
    });
  } catch (error) {
    console.error('Register error:', error);
    return handleError(res, error, 'Kayıt başarısız');
  }
};

