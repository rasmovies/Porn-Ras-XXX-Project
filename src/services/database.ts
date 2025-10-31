import { supabase, Category, Model, Video, Comment, Channel, Profile, BanUser, Notification, Settings, BackgroundImage } from '../lib/supabase';

// Categories
export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create category
  async create(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update category
  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete category
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Increment click count
  async incrementClickCount(id: string): Promise<void> {
    // First get current click_count
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('click_count')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentCount = category?.click_count || 0;
    
    // Increment by 1
    const { error } = await supabase
      .from('categories')
      .update({ click_count: currentCount + 1 })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Models
export const modelService = {
  // Get all models
  async getAll(): Promise<Model[]> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create model
  async create(model: Omit<Model, 'id' | 'created_at'>): Promise<Model> {
    const { data, error } = await supabase
      .from('models')
      .insert([model])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update model
  async update(id: string, updates: Partial<Model>): Promise<Model> {
    const { data, error } = await supabase
      .from('models')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete model
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Videos
export const videoService = {
  // Get all videos
  async getAll(): Promise<Video[]> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories(name),
        models(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get video by slug
  async getBySlug(slug: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories(name),
        models(name)
      `)
      .eq('slug', slug)
      .single();
    
    if (error) return null;
    return data;
  },

  // Create video
  async create(video: Omit<Video, 'id' | 'created_at' | 'views' | 'likes' | 'dislikes'>): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .insert([{
        ...video,
        views: 0,
        likes: 0,
        dislikes: 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update video
  async update(id: string, updates: Partial<Video>): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete video
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Increment views
  async incrementViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_views', { video_id: id });
    if (error) throw error;
  },

  // Get videos by streamtape URL
  async getByStreamtapeUrl(url: string): Promise<Video[]> {
    // Extract video ID from URL (both /v/ and /e/ formats)
    let videoId = '';
    if (url.includes('/e/')) {
      videoId = url.split('/e/')[1].split('/')[0];
    } else if (url.includes('/v/')) {
      videoId = url.split('/v/')[1].split('/')[0];
    }

    if (!videoId) return [];

    // Search for videos with matching streamtape URL or video ID
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories(name),
        models(name)
      `)
      .or(`streamtape_url.ilike.%${videoId}%,streamtape_url.ilike.%${url}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Comments
export const commentService = {
  // Get comments for video
  async getByVideoId(videoId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create comment
  async create(comment: Omit<Comment, 'id' | 'created_at' | 'likes' | 'dislikes'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        ...comment,
        likes: 0,
        dislikes: 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update comment
  async update(id: string, updates: Partial<Comment>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete comment
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Channels
export const channelService = {
  // Get all channels
  async getAll(): Promise<Channel[]> {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create channel
  async create(channel: Omit<Channel, 'id' | 'created_at' | 'subscriber_count'>): Promise<Channel> {
    const { data, error } = await supabase
      .from('channels')
      .insert([{
        ...channel,
        subscriber_count: 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update channel
  async update(id: string, updates: Partial<Channel>): Promise<Channel> {
    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete channel
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Profiles
export const profileService = {
  // Get all profiles
  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get profile by username
  async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_name', username)
      .single();
    
    if (error) return null;
    return data;
  },

  // Create or update profile
  async upsert(profile: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_name'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update profile
  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Admin Users
export const adminUserService = {
  // Check if user is admin
  async isAdmin(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('is_admin')
      .eq('user_name', username)
      .single();
    
    if (error) return false;
    return data?.is_admin === true;
  },

  // Get admin user
  async getByUsername(username: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_name', username)
      .single();
    
    if (error) return null;
    return data;
  }
};

// Ban Users
export const banUserService = {
  // Get all bans
  async getAll(): Promise<BanUser[]> {
    const { data, error } = await supabase
      .from('ban_users')
      .select('*')
      .order('banned_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Check if user is banned
  async isUserBanned(username: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_user_banned', {
      user_name_param: username
    });
    
    if (error) return false;
    return data === true;
  },

  // Get user ban info
  async getUserBanInfo(username: string): Promise<{ban_type: string, expires_at: string, reason: string} | null> {
    const { data, error } = await supabase.rpc('get_user_ban_info', {
      user_name_param: username
    });
    
    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  // Create ban
  async createBan(userId: string, reason: string | null, banType: string): Promise<BanUser> {
    const expiresAt = (() => {
      const now = new Date();
      switch (banType) {
        case '5_days':
          return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
        case '10_days':
          return new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
        case '1_month':
          return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        case '3_months':
          return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
        case '6_months':
          return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();
        case 'lifetime':
          return null;
        default:
          return null;
      }
    })();

    const { data, error } = await supabase
      .from('ban_users')
      .insert([{
        user_id: userId,
        reason: reason,
        ban_type: banType,
        expires_at: expiresAt,
        is_active: true,
        banned_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update ban
  async updateBan(id: string, updates: Partial<BanUser>): Promise<BanUser> {
    const { data, error } = await supabase
      .from('ban_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete/unban user
  async unbanUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('ban_users')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Notifications
export const notificationService = {
  // Get all notifications for user
  async getByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create notification
  async create(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'is_read'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notification,
        is_read: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark as read
  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete notification
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Settings
export const settingsService = {
  // Get setting by key
  async getByKey(key: string): Promise<Settings | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single();
    
    if (error) return null;
    return data;
  },

  // Get setting value
  async getValue(key: string): Promise<string | null> {
    const setting = await this.getByKey(key);
    return setting?.value || null;
  },

  // Upsert setting
  async upsert(key: string, value: string | null): Promise<Settings> {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Background Images Library
export const backgroundImageService = {
  // Get all background images
  async getAll(): Promise<BackgroundImage[]> {
    const { data, error } = await supabase
      .from('background_images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create background image
  async create(name: string, imageData: string, fileSize: number, width?: number, height?: number): Promise<BackgroundImage> {
    const { data, error } = await supabase
      .from('background_images')
      .insert([{
        name,
        image_data: imageData,
        file_size: fileSize,
        width: width || null,
        height: height || null,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete background image
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('background_images')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Update background image
  async update(id: string, updates: Partial<BackgroundImage>): Promise<BackgroundImage> {
    const { data, error } = await supabase
      .from('background_images')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
