const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 
  'https://rjjzviliwwlbjxfnpxsi.supabase.co';

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqanp2aWxpd3dsYmp4Zm5weHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTE0OTMsImV4cCI6MjA3NDQ2NzQ5M30.Mz1QxAZZz6POk7M5B8n9oM0-Pi2jSFJDLzhTT7cwPPE';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ WARNING: Using hardcoded Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file for production.');
}

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };

