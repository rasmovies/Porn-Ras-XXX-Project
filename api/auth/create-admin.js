const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');

/**
 * POST /api/auth/create-admin
 * Create admin user in both Supabase Auth and profiles table
 * This is a one-time setup endpoint
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
    
    // Default admin credentials
    const adminUsername = username || 'Pornras Admin';
    const adminEmail = email || 'admin@pornras.com';
    const adminPassword = password || '1qA2ws3ed*';
    
    // Check if admin already exists in profiles
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_name', adminUsername)
      .limit(1);
    
    if (checkError) {
      console.error('Profile check error:', checkError);
    }
    
    let profile = existingProfile && existingProfile.length > 0 ? existingProfile[0] : null;
    
    // Step 1: Create/Update profile
    if (!profile) {
      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_name: adminUsername,
          email: adminEmail,
          name: adminUsername,
          subscriber_count: 0,
          videos_watched: 0,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        throw new Error('Failed to create admin profile: ' + profileError.message);
      }
      
      profile = newProfile;
    } else {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: adminEmail,
          name: adminUsername,
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_name', adminUsername)
        .select()
        .single();
      
      if (updateError) {
        console.error('Profile update error:', updateError);
      } else {
        profile = updatedProfile;
      }
    }
    
    // Step 2: Create admin_users entry
    const { data: adminUser, error: adminUserError } = await supabase
      .from('admin_users')
      .upsert({
        user_name: adminUsername,
        is_admin: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_name'
      })
      .select()
      .single();
    
    if (adminUserError) {
      console.error('Admin user creation error:', adminUserError);
      // Continue anyway - table might not exist
    }
    
    // Step 3: Create user in Supabase Auth
    let authUser = null;
    let authError = null;
    
    try {
      // First, try to sign in to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (!signInError && signInData.user) {
        // User already exists in Auth
        authUser = signInData.user;
        console.log('Admin user already exists in Auth');
      } else {
        // User doesn't exist, create it
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            data: {
              username: adminUsername,
              name: adminUsername,
              is_admin: true
            }
          }
        });
        
        if (signUpError) {
          authError = signUpError;
          console.error('Supabase Auth signup error:', signUpError);
        } else {
          authUser = signUpData.user;
        }
      }
    } catch (authException) {
      console.error('Supabase Auth exception:', authException);
      authError = authException;
    }
    
    res.json({
      success: true,
      message: 'Admin user created/updated successfully',
      user: {
        username: adminUsername,
        email: adminEmail,
        profile: profile,
        authCreated: !!authUser,
        authError: authError?.message || null
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return handleError(res, error, 'Failed to create admin user');
  }
};

