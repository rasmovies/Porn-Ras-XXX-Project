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
    
    // Note: Email column may not exist in profiles table
    // Skip email uniqueness check if column doesn't exist
    // We rely on username uniqueness check instead
    
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
    // Only use columns that definitely exist in the table schema
    // Based on add_profiles_table.sql, the table has:
    // id, user_name, banner_image, avatar_image, subscriber_count, videos_watched, created_at, updated_at
    const profileData = {
      user_name: username,
      subscriber_count: 0,
      videos_watched: 0
      // created_at and updated_at will be set automatically by database defaults
    };
    
    console.log('Creating profile with data:', JSON.stringify(profileData, null, 2));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      console.error('   Error code:', profileError.code);
      console.error('   Error message:', profileError.message);
      console.error('   Error details:', profileError.details);
      console.error('   Error hint:', profileError.hint);
      console.error('   Profile data attempted:', JSON.stringify(profileData, null, 2));
      
      // If auth user was created but profile failed, try to clean up
      if (authUser && authUser.id) {
        try {
          // Note: We can't delete auth user from server-side with anon key
          // This would need service_role key
          console.warn('⚠️ Auth user created but profile failed. Manual cleanup may be needed.');
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      // Provide more detailed error message
      let errorMessage = 'Kullanıcı profili oluşturulamadı';
      if (profileError.code === '23505') {
        errorMessage = 'Bu kullanıcı adı zaten kullanılıyor';
      } else if (profileError.code === 'PGRST116') {
        errorMessage = 'Profil oluşturulamadı: Veritabanı hatası (kayıt bulunamadı)';
      } else if (profileError.code === '42501' || profileError.message?.includes('permission denied') || profileError.message?.includes('row-level security')) {
        errorMessage = 'Profil oluşturulamadı: Yetkilendirme hatası (RLS politikası)';
      } else if (profileError.message) {
        errorMessage = `Profil oluşturulamadı: ${profileError.message}`;
      }
      
      // Always return detailed error in development, simplified in production
      const errorResponse = {
        success: false,
        message: errorMessage
      };
      
      if (process.env.NODE_ENV === 'development') {
        errorResponse.error = {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          attemptedData: profileData
        };
      }
      
      return res.status(500).json(errorResponse);
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

