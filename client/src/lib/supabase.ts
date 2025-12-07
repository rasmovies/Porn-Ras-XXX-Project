import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// Fallback to hardcoded values for development (DO NOT commit these in production)
const supabaseUrl = 
  process.env.REACT_APP_SUPABASE_URL || 
  'https://xgyjhofakpatrqgvleze.supabase.co';

const supabaseAnonKey = 
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqanp2aWxpd3dsYmp4Zm5weHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTE0OTMsImV4cCI6MjA3NDQ2NzQ5M30.Mz1QxAZZz6POk7M5B8n9oM0-Pi2jSFJDLzhTT7cwPPE';

// Debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Configuration:');
  console.log('  URL:', supabaseUrl);
  console.log('  Key from ENV:', !!process.env.REACT_APP_SUPABASE_ANON_KEY ? 'YES ✅' : 'NO ❌');
  console.log('  Key length:', supabaseAnonKey?.length || 0);
  console.log('  Key preview:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'MISSING');
}

if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn('⚠️ WARNING: Using hardcoded Supabase credentials. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in Vercel environment variables for production.');
  console.warn('⚠️ This will cause "Invalid API key" errors in production if the hardcoded key is wrong!');
}

if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Configuration:');
  console.log('  URL:', supabaseUrl);
  console.log('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing');
  console.log('  From ENV:', {
    url: !!process.env.REACT_APP_SUPABASE_URL,
    key: !!process.env.REACT_APP_SUPABASE_ANON_KEY
  });
}

// Supabase client configuration with proper headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

// Database types
export interface Category {
  id: string;
  name: string;
  thumbnail: string | null;
  click_count?: number;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  image: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  streamtape_url: string | null;
  duration: string | null;
  category_id: string | null;
  model_id: string | null;
  channel_id: string | null;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  slug: string;
}

export interface Comment {
  id: string;
  video_id: string;
  author: string;
  content: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  banner: string | null;
  subscriber_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  user_name: string;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  banner_image: string | null;
  avatar_image: string | null;
  subscriber_count: number;
  videos_watched: number;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BanUser {
  id: string;
  user_id: string;
  reason: string | null;
  ban_type: '5_days' | '10_days' | '1_month' | '3_months' | '6_months' | 'lifetime';
  banned_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'ban' | 'message' | 'comment' | 'like' | 'system' | 'video';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackgroundImage {
  id: string;
  name: string;
  image_data: string; // base64 encoded image
  file_size: number; // in bytes
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_name: string;
  model_id: string;
  created_at: string;
}

export interface ChannelSubscription {
  id: string;
  user_name: string;
  channel_id: string;
  created_at: string;
}

export interface UserPost {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UserGif {
  id: string;
  user_name: string;
  gif_url: string | null;
  gif_file_base64: string | null;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPlaylist {
  id: string;
  user_name: string;
  playlist_name: string;
  video_ids: string[];
  created_at: string;
  updated_at: string;
}
