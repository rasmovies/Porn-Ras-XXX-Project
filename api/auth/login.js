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
    let profile = null;
    
    // Find user in profiles table
    let query = supabase.from('profiles').select('*');
    
    if (isEmail) {
      // Search by email or username (email prefix)
      const emailPrefix = emailOrUsername.split('@')[0];
      query = query.or(`email.eq.${emailOrUsername},user_name.eq.${emailPrefix}`);
    } else {
      // Search by username
      query = query.eq('user_name', emailOrUsername);
    }
    
    const { data: profiles, error: profileError } = await query.limit(1);
    
    if (profileError) {
      console.error('Profile search error:', profileError);
      return res.status(500).json({ 
        success: false, 
        message: 'Kullanıcı bulunurken hata oluştu' 
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
    
    // Email bulunamazsa hata döndür
    if (!userEmail) {
      return res.status(401).json({ 
        success: false, 
        message: 'Kullanıcı email adresi bulunamadı' 
      });
    }
    
    // Try to sign in with Supabase Auth using email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz email/kullanıcı adı veya şifre' 
      });
    }
    
    // Return user data
    res.json({
      success: true,
      user: {
        id: authData.user.id,
        username: username,
        email: userEmail,
        name: profile.name || username,
        avatar: profile.avatar || null,
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Login error:', error);
    return handleError(res, error, 'Login failed');
  }
};

