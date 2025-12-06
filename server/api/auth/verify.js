const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');

/**
 * POST /api/auth/verify
 * Verify user email address
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
    const { token, email } = req.body;
    
    if (!token || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and email are required' 
      });
    }
    
    // TODO: Token validation logic (check if token is valid and not expired)
    // For now, we'll just verify the email format and update the user
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    // Extract username from email (before @)
    // Note: In production, you should store username separately or use a token-based lookup
    const username = email.split('@')[0];
    
    // Update user's email_verified status in Supabase
    // First try to find by email if there's an email field, otherwise use username
    const { data: profiles, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_name', username)
      .limit(1);
    
    if (findError) {
      throw new Error('Failed to find user: ' + findError.message);
    }
    
    if (!profiles || profiles.length === 0) {
      // User doesn't exist, create a basic profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_name: username,
          email_verified: true,
          subscriber_count: 0,
          videos_watched: 0,
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error('Failed to create profile: ' + createError.message);
      }
      
      return res.json({ 
        success: true, 
        message: 'Email verified successfully',
        profile: newProfile
      });
    }
    
    // Update existing profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_name', username)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase update error:', updateError);
      // If user doesn't exist, create a basic profile
      if (updateError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_name: username,
            email_verified: true,
            subscriber_count: 0,
            videos_watched: 0,
          })
          .select()
          .single();
        
        if (createError) {
          throw new Error('Failed to create profile: ' + createError.message);
        }
        
        return res.json({ 
          success: true, 
          message: 'Email verified successfully',
          profile: newProfile
        });
      }
      
      throw updateError;
    }
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Email verified successfully',
      profile
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return handleError(res, error, 'Email verification failed.');
  }
};

