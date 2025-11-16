import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// Fallback to hardcoded values for development (DO NOT commit these in production)
const supabaseUrl = 
  process.env.REACT_APP_SUPABASE_URL || 
  'https://xgyjhofakpatrqgvleze.supabase.co';

const supabaseAnonKey = 
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ';

if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn('⚠️ WARNING: Using hardcoded Supabase credentials. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env file for production.');
}

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  banner_image: string | null;
  avatar_image: string | null;
  subscriber_count: number;
  videos_watched: number;
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
