/**
 * Script to create admin user
 * Run this with: node scripts/create-admin-user.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://xgyjhofakpatrqgvleze.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_USERNAME = 'Pornras Admin';
const ADMIN_EMAIL = 'admin@pornras.com';
const ADMIN_PASSWORD = '1qA2ws3ed*';

async function createAdminUser() {
  console.log('🔧 Creating admin user...');
  console.log(`Username: ${ADMIN_USERNAME}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  
  try {
    // Step 1: Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_name', ADMIN_USERNAME)
      .limit(1);
    
    let profile = existingProfile && existingProfile.length > 0 ? existingProfile[0] : null;
    
    // Step 2: Create or update profile
    if (!profile) {
      console.log('📝 Creating profile...');
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_name: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          name: ADMIN_USERNAME,
          subscriber_count: 0,
          videos_watched: 0,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        throw new Error('Failed to create profile: ' + profileError.message);
      }
      
      profile = newProfile;
      console.log('✅ Profile created');
    } else {
      console.log('✅ Profile already exists');
      // Update email if needed
      if (profile.email !== ADMIN_EMAIL) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ email: ADMIN_EMAIL, updated_at: new Date().toISOString() })
          .eq('user_name', ADMIN_USERNAME);
        
        if (updateError) {
          console.error('⚠️ Failed to update profile email:', updateError);
        } else {
          console.log('✅ Profile email updated');
        }
      }
    }
    
    // Step 3: Create admin_users entry
    console.log('📝 Creating admin_users entry...');
    const { data: adminUser, error: adminUserError } = await supabase
      .from('admin_users')
      .upsert({
        user_name: ADMIN_USERNAME,
        is_admin: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_name'
      })
      .select()
      .single();
    
    if (adminUserError) {
      console.error('⚠️ Admin user creation error:', adminUserError);
      console.log('⚠️ admin_users table might not exist. Run the SQL script first.');
    } else {
      console.log('✅ Admin user entry created/updated');
    }
    
    // Step 4: Create user in Supabase Auth
    console.log('📝 Creating user in Supabase Auth...');
    try {
      // First, try to sign in to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      
      if (!signInError && signInData.user) {
        console.log('✅ User already exists in Supabase Auth');
        console.log('✅ Admin user setup complete!');
        return;
      }
      
      // User doesn't exist, create it
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          data: {
            username: ADMIN_USERNAME,
            name: ADMIN_USERNAME,
            is_admin: true
          }
        }
      });
      
      if (signUpError) {
        console.error('⚠️ Supabase Auth signup error:', signUpError.message);
        console.log('⚠️ You may need to create the user manually in Supabase Dashboard');
      } else {
        console.log('✅ User created in Supabase Auth');
        console.log('✅ Admin user setup complete!');
      }
    } catch (authException) {
      console.error('⚠️ Supabase Auth exception:', authException.message);
      console.log('⚠️ You may need to create the user manually in Supabase Dashboard');
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();

