const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 
  'https://xgyjhofakpatrqgvleze.supabase.co';

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ WARNING: Using hardcoded Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file for production.');
}

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };


