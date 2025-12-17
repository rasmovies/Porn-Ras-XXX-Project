import { supabase, Category, Model, Video, Comment, Channel, Profile, BanUser, Notification, Settings, BackgroundImage, Subscription, ChannelSubscription, UserPost, UserGif, UserPlaylist, Poll, PollOption, PollResponse } from '../lib/supabase';

// Categories
export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
      if (error) {
        console.error('❌ Categories fetch error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          console.warn('⚠️ Categories table does not exist, returning empty array');
          return [];
        }
        throw error;
      }
      console.log('✅ Categories loaded:', data?.length || 0);
    return data || [];
    } catch (error: any) {
      console.error('❌ Categories service error:', error);
      return [];
    }
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

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
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
    try {
      // Optimize query: only select necessary columns and reduce limit
      // Note: is_trans column may not exist in database yet, so we don't select it
      // We'll default it to false in the mapping
    const { data, error } = await supabase
      .from('models')
        .select('id, name, image, created_at')
        .order('created_at', { ascending: false })
        // No limit - fetch all models (Supabase default limit is 1000)
      
      if (error) {
        console.error('❌ Models fetch error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        console.error('   Error hint:', error.hint);
        const errorStatus = (error as any).status;
        console.error('   Error status:', errorStatus);
        
        // 406 (Not Acceptable) - RLS policy issue
        if (errorStatus === 406 || error.code === 'PGRST301') {
          console.error('⚠️ RLS (Row Level Security) policy blocking access to models table!');
          console.error('   Please check Supabase RLS policies for the "models" table.');
          console.error('   The table should allow SELECT for authenticated or anonymous users.');
          return [];
        }
        
        // Timeout hatası (57014) veya 500 hatası (genellikle timeout'tan kaynaklanır)
        if (error.code === '57014' || 
            error.message?.includes('statement timeout') || 
            error.message?.includes('timeout') ||
            error.code === 'PGRST301' || 
            error.message?.includes('500') || 
            error.message?.includes('Internal Server Error')) {
          console.warn('⚠️ Supabase timeout/server error, boş array döndürülüyor');
          console.warn('   Error code:', error.code);
          console.warn('   Error message:', error.message);
          return [];
        }
        
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          console.warn('⚠️ Models table does not exist, returning empty array');
          return [];
        }
        
        // Diğer hatalar için de boş array döndür (crash önleme)
        console.warn('⚠️ Models fetch hatası, boş array döndürülüyor');
        console.warn('   This might be an RLS policy issue. Check Supabase dashboard.');
        return [];
      }
      console.log('✅ Models loaded:', data?.length || 0);
    return data || [];
    } catch (error: any) {
      console.error('❌ Models service error:', error);
      console.error('   Error code:', error?.code);
      console.error('   Error message:', error?.message);
      
      // Timeout hatası kontrolü (57014) veya 500 hatası
      if (error?.code === '57014' || 
          error?.message?.includes('statement timeout') || 
          error?.message?.includes('timeout') ||
          error?.code === 'PGRST301' ||
          error?.message?.includes('500') ||
          error?.message?.includes('Internal Server Error')) {
        console.warn('⚠️ Supabase timeout/server error (catch), boş array döndürülüyor');
        return [];
      }
      
      // Return empty array on any error to prevent app crash
      return [];
    }
  },

  // Create model
  async create(model: Omit<Model, 'id' | 'created_at'>): Promise<Model> {
    // Only include is_trans if it's explicitly set (to avoid errors if column doesn't exist)
    const modelData: any = {
      name: model.name,
      image: model.image
    };
    
    // Only add is_trans if it's explicitly true (to avoid errors if column doesn't exist)
    // If column doesn't exist, we'll just skip it
    if (model.is_trans === true) {
      modelData.is_trans = true;
    }
    
    const { data, error } = await supabase
      .from('models')
      .insert([modelData])
      .select()
      .single();
    
    // If successful and is_trans is true, save to localStorage
    if (!error && data && model.is_trans === true) {
      try {
        const transModels = JSON.parse(localStorage.getItem('transModels') || '[]');
        if (!transModels.includes(data.id)) {
          transModels.push(data.id);
          localStorage.setItem('transModels', JSON.stringify(transModels));
          console.log('✅ Saved trans model to localStorage:', data.id, data.name);
        }
      } catch (e) {
        console.error('Failed to save trans model to localStorage:', e);
      }
    }
    
    if (error) {
      // Handle 409 (Conflict) or 23505 (Unique constraint violation) - duplicate model name
      const errorStatus = (error as any).status;
      if (error.code === '23505' || errorStatus === 409 || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        const duplicateError = new Error(`Model "${model.name}" already exists`);
        (duplicateError as any).code = '23505';
        (duplicateError as any).status = 409;
        throw duplicateError;
      }
      
      // If error is about is_trans column not existing, try again without it
      if (error.message?.includes('is_trans') || error.code === '42703') {
        console.warn('⚠️ is_trans column does not exist, creating model without it');
        const { data: retryData, error: retryError } = await supabase
          .from('models')
          .insert([{ name: model.name, image: model.image }])
          .select()
          .single();
        
        if (retryError) {
          // Handle 409/23505 in retry as well
          const retryErrorStatus = (retryError as any).status;
          if (retryError.code === '23505' || retryErrorStatus === 409) {
            const duplicateError = new Error(`Model "${model.name}" already exists`);
            (duplicateError as any).code = '23505';
            (duplicateError as any).status = 409;
            throw duplicateError;
          }
          throw retryError;
        }
        
        // Save is_trans to localStorage if it's true
        if (model.is_trans === true) {
          try {
            const transModels = JSON.parse(localStorage.getItem('transModels') || '[]');
            if (!transModels.includes(retryData.id)) {
              transModels.push(retryData.id);
              localStorage.setItem('transModels', JSON.stringify(transModels));
              console.log('✅ Saved trans model to localStorage:', retryData.id);
            }
          } catch (e) {
            console.error('Failed to save trans model to localStorage:', e);
          }
        }
        
        return { ...retryData, is_trans: model.is_trans || false };
      }
      throw error;
    }
    
    // Save is_trans to localStorage if it's true (in case column doesn't exist but insert succeeded)
    if (model.is_trans === true) {
      try {
        const transModels = JSON.parse(localStorage.getItem('transModels') || '[]');
        if (!transModels.includes(data.id)) {
          transModels.push(data.id);
          localStorage.setItem('transModels', JSON.stringify(transModels));
          console.log('✅ Saved trans model to localStorage:', data.id);
        }
      } catch (e) {
        console.error('Failed to save trans model to localStorage:', e);
      }
    }
    
    return { ...data, is_trans: data.is_trans || false };
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

  // Get model by ID
  async getById(id: string): Promise<Model | null> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
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
    try {
      // Timeout hatasını önlemek için limit ekle ve optimize et
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        categories(name),
        models(name)
      `)
        .order('created_at', { ascending: false })
        .limit(1000); // Maksimum 1000 video (timeout önleme)
      
      if (error) {
        console.error('❌ Videos fetch error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        console.error('   Error hint:', error.hint);
        
        // Timeout hatası (57014)
        if (error.code === '57014' || error.message?.includes('statement timeout')) {
          console.warn('⚠️ Supabase timeout hatası, boş array döndürülüyor');
          return [];
        }
        
        // CORS veya network hatası
        if (error.message?.includes('Load failed') || 
            error.message?.includes('TypeError') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError')) {
          console.warn('⚠️ Network/CORS hatası, boş array döndürülüyor');
          return [];
        }
        
        // If table doesn't exist, return empty array
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          console.warn('⚠️ Videos table does not exist, returning empty array');
          return [];
        }
        
        // Diğer hatalar için de boş array döndür (crash önleme)
        console.warn('⚠️ Videos fetch hatası, boş array döndürülüyor');
        return [];
      }
      console.log('✅ Videos loaded:', data?.length || 0);
    return data || [];
    } catch (error: any) {
      console.error('❌ Videos service error:', error);
      console.error('   Error type:', error?.constructor?.name);
      console.error('   Error message:', error?.message);
      
      // Timeout hatası (57014)
      if (error?.code === '57014' || error?.message?.includes('statement timeout')) {
        console.warn('⚠️ Supabase timeout hatası, boş array döndürülüyor');
        return [];
      }
      
      // Network hataları için boş array döndür
      if (error?.message?.includes('Load failed') || 
          error?.message?.includes('TypeError') ||
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('NetworkError')) {
        console.warn('⚠️ Network hatası, boş array döndürülüyor');
        return [];
      }
      
      return [];
    }
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
  async create(video: Omit<Video, 'id' | 'created_at' | 'views' | 'likes' | 'dislikes' | 'favorites'>): Promise<Video> {
    // Separate tags from other video data (tags column may not exist in DB)
    const { tags, ...videoWithoutTags } = video as any;
    
    const videoData: any = {
      ...videoWithoutTags,
      views: 0,
      likes: 0,
      dislikes: 0,
      favorites: 0
    };
    
    // Only include tags if it's provided (column may not exist in DB)
    if (tags !== undefined && tags !== null) {
      videoData.tags = tags;
    }
    
    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();
    
    if (error) {
      // If error is about tags column not existing, try again without it
      if (error.message?.includes('tags') || error.code === '42703') {
        console.warn('⚠️ tags column does not exist, creating video without it');
        const { tags: _, ...videoDataWithoutTags } = videoData;
        const { data: retryData, error: retryError } = await supabase
          .from('videos')
          .insert([videoDataWithoutTags])
          .select()
          .single();
        
        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }
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
    try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Timeout önleme için limit
      
      if (error) {
        console.error('❌ Channels fetch error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        
        // Timeout hatası (57014)
        if (error.code === '57014' || error.message?.includes('statement timeout')) {
          console.warn('⚠️ Supabase timeout hatası, boş array döndürülüyor');
          return [];
        }
        
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          console.warn('⚠️ Channels table does not exist, returning empty array');
          return [];
        }
        
        // Diğer hatalar için de boş array döndür (crash önleme)
        console.warn('⚠️ Channels fetch hatası, boş array döndürülüyor');
        return [];
      }
      console.log('✅ Channels loaded:', data?.length || 0);
    return data || [];
    } catch (error: any) {
      console.error('❌ Channels service error:', error);
      console.error('   Error code:', error?.code);
      console.error('   Error message:', error?.message);
      
      // Timeout hatası kontrolü
      if (error?.code === '57014' || error?.message?.includes('statement timeout')) {
        console.warn('⚠️ Supabase timeout hatası (catch), boş array döndürülüyor');
        return [];
      }
      
      // Return empty array on any error to prevent app crash
      return [];
    }
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

// Polls
export const pollService = {
  // Get all polls
  async getAll(): Promise<Poll[]> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Polls fetch error:', error);
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error: any) {
      console.error('❌ Polls service error:', error);
      return [];
    }
  },

  // Get active polls
  async getActive(): Promise<Poll[]> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205') return [];
        throw error;
      }
      return data || [];
    } catch (error: any) {
      console.error('❌ Active polls fetch error:', error);
      return [];
    }
  },

  // Get poll by ID
  async getById(id: string): Promise<Poll | null> {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  },

  // Create poll
  async create(poll: Omit<Poll, 'id' | 'created_at' | 'updated_at'>): Promise<Poll> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .insert([poll])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Poll create error:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        console.error('   Error hint:', error.hint);
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('❌ Poll service create error:', error);
      throw error;
    }
  },

  // Update poll
  async update(id: string, updates: Partial<Poll>): Promise<Poll> {
    const { data, error } = await supabase
      .from('polls')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete poll
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Poll Options
export const pollOptionService = {
  // Get options for a poll
  async getByPollId(pollId: string): Promise<PollOption[]> {
    try {
      const { data, error } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', pollId)
        .order('display_order', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST205') return [];
        throw error;
      }
      return data || [];
    } catch (error: any) {
      console.error('❌ Poll options fetch error:', error);
      return [];
    }
  },

  // Create poll option
  async create(option: Omit<PollOption, 'id' | 'created_at'>): Promise<PollOption> {
    const { data, error } = await supabase
      .from('poll_options')
      .insert([option])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create multiple options
  async createMultiple(options: Omit<PollOption, 'id' | 'created_at'>[]): Promise<PollOption[]> {
    const { data, error } = await supabase
      .from('poll_options')
      .insert(options)
      .select();
    
    if (error) throw error;
    return data || [];
  },

  // Update poll option
  async update(id: string, updates: Partial<PollOption>): Promise<PollOption> {
    const { data, error } = await supabase
      .from('poll_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete poll option
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('poll_options')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Delete all options for a poll
  async deleteByPollId(pollId: string): Promise<void> {
    const { error } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);
    
    if (error) throw error;
  }
};

// Poll Responses
export const pollResponseService = {
  // Submit response
  async submit(pollId: string, optionId: string, userName: string | null): Promise<PollResponse> {
    const { data, error } = await supabase
      .from('poll_responses')
      .insert([{
        poll_id: pollId,
        option_id: optionId,
        user_name: userName || 'anonymous',
        user_ip: null // Can be added later if needed
      }])
      .select()
      .single();
    
    if (error) {
      // If duplicate vote, update instead
      if (error.code === '23505') {
        const { data: updated } = await supabase
          .from('poll_responses')
          .update({ option_id: optionId })
          .eq('poll_id', pollId)
          .eq('user_name', userName || 'anonymous')
          .select()
          .single();
        return updated!;
      }
      throw error;
    }
    return data;
  },

  // Get user's response for a poll
  async getUserResponse(pollId: string, userName: string | null): Promise<PollResponse | null> {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_name', userName || 'anonymous')
        .single();
      
      if (error) {
        // 406 (Not Acceptable) or PGRST116 (No rows returned) - user hasn't voted yet
        const errorStatus = (error as any).status;
        if (error.code === 'PGRST116' || errorStatus === 406) {
          return null;
        }
        console.error('❌ Error getting user response:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('❌ Exception getting user response:', error);
      return null;
    }
  },

  // Get response counts for a poll
  async getResponseCounts(pollId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select('option_id')
        .eq('poll_id', pollId);
      
      if (error) {
        // 406 (Not Acceptable) - RLS policy issue, return empty counts
        const errorStatus = (error as any).status;
        if (errorStatus === 406) {
          console.warn('⚠️ Poll responses access denied (406), returning empty counts');
          return {};
        }
        console.error('❌ Error getting response counts:', error);
        return {};
      }
      
      const counts: Record<string, number> = {};
      data?.forEach(response => {
        counts[response.option_id] = (counts[response.option_id] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error('❌ Exception getting response counts:', error);
      return {};
    }
  },

  // Get total responses for a poll
  async getTotalResponses(pollId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('poll_responses')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollId);
      
      if (error) {
        // 406 (Not Acceptable) - RLS policy issue, return 0
        const errorStatus = (error as any).status;
        if (errorStatus === 406) {
          console.warn('⚠️ Poll responses access denied (406), returning 0');
          return 0;
        }
        console.error('❌ Error getting total responses:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('❌ Exception getting total responses:', error);
      return 0;
    }
  }
};
