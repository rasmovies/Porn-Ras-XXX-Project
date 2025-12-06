const { setCorsHeaders, handleOptions } = require('./_helpers/cors');
const { supabase } = require('../lib/supabase');

/**
 * GET /api/test-supabase
 * Test Supabase connection
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }
  
  try {
    // Test 1: Check Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://xgyjhofakpatrqgvleze.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing';
    
    // Test 2: Try to query profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    // Test 3: Try to query categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    // Test 4: Try to query videos table
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .limit(5);
    
    res.json({
      success: true,
      connection: {
        supabaseUrl,
        supabaseKey,
        connected: true
      },
      tests: {
        profiles: {
          success: !profilesError,
          error: profilesError?.message || null,
          count: profiles?.length || 0,
          sample: profiles?.[0] || null
        },
        categories: {
          success: !categoriesError,
          error: categoriesError?.message || null,
          count: categories?.length || 0,
          sample: categories?.[0] || null
        },
        videos: {
          success: !videosError,
          error: videosError?.message || null,
          count: videos?.length || 0,
          sample: videos?.[0] || null
        }
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    console.error('Supabase test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

