import { supabase, Category, Model, Video, Comment, Channel, Profile, BanUser, Notification, Settings, BackgroundImage, Subscription, ChannelSubscription, UserPost, UserGif, UserPlaylist } from '../lib/supabase';

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
  // Check if user is admin (case-insensitive)
  async isAdmin(username: string): Promise<boolean> {
    if (!username) {
      console.warn('⚠️ Admin check: username is empty');
      return false;
    }
    
    // Normalize username for comparison (trim and lowercase)
    const normalizedUsername = username.trim().toLowerCase();
    console.log(`🔍 Admin check started for: "${username}" (normalized: "${normalizedUsername}")`);
    
    try {
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('admin_users')
        .select('is_admin, user_name')
        .eq('user_name', username)
        .single();
      
      if (!exactError && exactMatch) {
        console.log(`✅ Exact match found: "${exactMatch.user_name}" -> is_admin: ${exactMatch.is_admin}`);
        if (exactMatch.is_admin === true) {
          return true;
        }
      } else {
        console.log(`⚠️ Exact match failed:`, exactError?.message || 'No match found');
      }
      
      // If exact match fails, try case-insensitive match by fetching all admins
      console.log('🔍 Trying case-insensitive match...');
      const { data: allAdmins, error: fetchError } = await supabase
        .from('admin_users')
        .select('is_admin, user_name');
      
      if (fetchError) {
        console.error('❌ Admin check error:', fetchError);
        console.error('   Error details:', JSON.stringify(fetchError, null, 2));
        return false;
      }
      
      if (!allAdmins || allAdmins.length === 0) {
        console.warn('⚠️ Admin_users table is empty!');
        return false;
      }
      
      console.log(`📋 Found ${allAdmins.length} admin user(s) in database:`);
      allAdmins.forEach(admin => {
        console.log(`   - "${admin.user_name}" -> is_admin: ${admin.is_admin}`);
      });
      
      // Check if any admin user matches (case-insensitive)
      const matchingAdmin = allAdmins.find(
        admin => admin.user_name?.toLowerCase().trim() === normalizedUsername && admin.is_admin === true
      );
      
      if (matchingAdmin) {
        console.log(`✅ Admin access granted for: "${username}" (matched with: "${matchingAdmin.user_name}")`);
        return true;
      } else {
        console.log(`❌ Admin access denied for: "${username}"`);
        console.log(`   Normalized username: "${normalizedUsername}"`);
        console.log(`   Available admins:`, allAdmins.map(a => `"${a.user_name?.toLowerCase()}"`).join(', '));
        return false;
      }
    } catch (error) {
      console.error('❌ Admin check exception:', error);
      console.error('   Stack:', error instanceof Error ? error.stack : 'N/A');
      return false;
    }
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

// Subscriptions
export const subscriptionService = {
  // Create subscription
  async subscribe(userName: string, modelId: string): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        user_name: userName,
        model_id: modelId
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Unsubscribe
  async unsubscribe(userName: string, modelId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_name', userName)
      .eq('model_id', modelId);
    
    if (error) throw error;
  },

  // Check if user is subscribed to a model
  async isSubscribed(userName: string, modelId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_name', userName)
      .eq('model_id', modelId)
      .single();
    
    return !error && data !== null;
  },

  // Get all subscriptions for a user
  async getByUser(userName: string): Promise<Array<Subscription & { model: Model }>> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        model:models(*)
      `)
      .eq('user_name', userName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get all subscribers for a model
  async getByModel(modelId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('model_id', modelId);
    
    if (error) throw error;
    return data || [];
  }
};

// Channel Subscriptions
export const channelSubscriptionService = {
  // Create channel subscription
  async subscribe(userName: string, channelId: string): Promise<ChannelSubscription> {
    const { data, error } = await supabase
      .from('channel_subscriptions')
      .insert([{
        user_name: userName,
        channel_id: channelId
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Unsubscribe from channel
  async unsubscribe(userName: string, channelId: string): Promise<void> {
    const { error } = await supabase
      .from('channel_subscriptions')
      .delete()
      .eq('user_name', userName)
      .eq('channel_id', channelId);
    
    if (error) throw error;
  },

  // Check if user is subscribed to a channel
  async isSubscribed(userName: string, channelId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('channel_subscriptions')
      .select('id')
      .eq('user_name', userName)
      .eq('channel_id', channelId)
      .single();
    
    return !error && data !== null;
  },

  // Get all channel subscriptions for a user
  async getByUser(userName: string): Promise<Array<ChannelSubscription & { channel: Channel }>> {
    const { data, error } = await supabase
      .from('channel_subscriptions')
      .select(`
        *,
        channel:channels(*)
      `)
      .eq('user_name', userName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get all subscribers for a channel
  async getByChannel(channelId: string): Promise<ChannelSubscription[]> {
    const { data, error } = await supabase
      .from('channel_subscriptions')
      .select('*')
      .eq('channel_id', channelId);
    
    if (error) throw error;
    return data || [];
  }
};

// User Posts
export const userPostService = {
  async getByUser(userName: string): Promise<UserPost[]> {
    const { data, error } = await supabase
      .from('user_posts')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async create(post: Omit<UserPost, 'id' | 'created_at' | 'updated_at'>): Promise<UserPost> {
    const { data, error } = await supabase
      .from('user_posts')
      .insert([post])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// User GIFs
export const userGifService = {
  async getAllApproved(): Promise<UserGif[]> {
    const { data, error } = await supabase
      .from('user_gifs')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async getByUser(userName: string): Promise<UserGif[]> {
    const { data, error } = await supabase
      .from('user_gifs')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async getPending(): Promise<UserGif[]> {
    const { data, error } = await supabase
      .from('user_gifs')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async create(gif: Omit<UserGif, 'id' | 'created_at' | 'updated_at' | 'is_approved' | 'approved_by' | 'approved_at'>): Promise<UserGif> {
    const { data, error } = await supabase
      .from('user_gifs')
      .insert([{
        ...gif,
        is_approved: false,
        approved_by: null,
        approved_at: null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async approve(id: string, approvedBy: string): Promise<UserGif> {
    const { data, error } = await supabase
      .from('user_gifs')
      .update({
        is_approved: true,
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_gifs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// User Playlists
export const userPlaylistService = {
  async getByUser(userName: string): Promise<UserPlaylist[]> {
    const { data, error } = await supabase
      .from('user_playlists')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async create(playlist: Omit<UserPlaylist, 'id' | 'created_at' | 'updated_at'>): Promise<UserPlaylist> {
    const { data, error } = await supabase
      .from('user_playlists')
      .insert([playlist])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async update(id: string, updates: Partial<UserPlaylist>): Promise<UserPlaylist> {
    const { data, error } = await supabase
      .from('user_playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_playlists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
