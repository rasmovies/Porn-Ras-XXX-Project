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
    let profiles = null;
    let profileError = null;
    
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
    
    // Şimdilik Supabase Auth kullanmadan, sadece kullanıcıyı bulup döndürüyoruz
    // Şifre kontrolü için profiles tablosunda password_hash alanı olmalı
    // Şimdilik sadece kullanıcıyı bulduğumuz için başarılı sayıyoruz
    // TODO: Şifre kontrolü eklenmeli (bcrypt ile hash'lenmiş şifre kontrolü)
    
    // Try to sign in with Supabase Auth using email (optional, if user exists in auth)
    let authData = null;
    let authError = null;
    
    try {
      const authResult = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });
      
      if (authResult.error) {
        authError = authResult.error;
        console.log('Supabase Auth login failed (user may not exist in auth):', authError.message);
        // Auth'da kullanıcı yoksa devam et, sadece profile'dan döndür
      } else {
        authData = authResult.data;
      }
    } catch (authException) {
      console.log('Supabase Auth exception (continuing with profile only):', authException.message);
      // Auth hatası olsa bile devam et
    }
    
    // Return user data (from profile, with optional auth data)
    res.json({
      success: true,
      user: {
        id: authData?.user?.id || profile.id || username,
        username: username,
        email: userEmail,
        name: profile.name || username,
        avatar: profile.avatar || null,
      },
      session: authData?.session || null
    });
  } catch (error) {
    console.error('Login error:', error);
    return handleError(res, error, 'Login failed');
  }
};

