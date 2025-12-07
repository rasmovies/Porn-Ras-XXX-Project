/**
 * Admin Setup Test Script
 * Bu script admin kullanıcısının doğru kurulup kurulmadığını test eder
 */

const { createClient } = require('@supabase/supabase-js');

// Try original URL first
const supabaseUrl = process.env.SUPABASE_URL || 'https://xgyjhofakpatrqgvleze.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqanp2aWxpd3dsYmp4Zm5weHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTE0OTMsImV4cCI6MjA3NDQ2NzQ5M30.Mz1QxAZZz6POk7M5B8n9oM0-Pi2jSFJDLzhTT7cwPPE';

console.log('🔑 Using Supabase Key:', supabaseAnonKey.substring(0, 30) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminSetup() {
  console.log('🔍 Admin Kullanıcı Kurulum Testi\n');
  console.log('='.repeat(50));
  
  const results = {
    profiles: { found: false, data: null, error: null },
    adminUsers: { found: false, data: null, error: null },
    adminCheck: { works: false, details: null }
  };
  
  // Test 1: Check profiles table
  console.log('\n1️⃣ Profiles Tablosu Kontrolü');
  console.log('-'.repeat(50));
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_name, email, name, password_hash')
      .ilike('user_name', '%Pornras Admin%');
    
    if (error) {
      results.profiles.error = error;
      console.error('❌ Hata:', error.message);
      console.error('   Code:', error.code);
    } else {
      results.profiles.data = profiles;
      results.profiles.found = profiles && profiles.length > 0;
      
      if (results.profiles.found) {
        console.log('✅ Pornras Admin profili bulundu!');
        profiles.forEach(p => {
          console.log(`   Username: "${p.user_name}"`);
          console.log(`   Email: ${p.email || '(yok)'}`);
          console.log(`   Name: ${p.name || '(yok)'}`);
          console.log(`   Password Hash: ${p.password_hash ? 'Var ✅' : 'Yok ❌'}`);
        });
      } else {
        console.log('❌ Pornras Admin profili bulunamadı!');
      }
    }
  } catch (err) {
    results.profiles.error = err;
    console.error('❌ Exception:', err.message);
  }
  
  // Test 2: Check admin_users table
  console.log('\n2️⃣ Admin_Users Tablosu Kontrolü');
  console.log('-'.repeat(50));
  try {
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('user_name, is_admin');
    
    if (error) {
      results.adminUsers.error = error;
      console.error('❌ Hata:', error.message);
      console.error('   Code:', error.code);
    } else {
      results.adminUsers.data = adminUsers;
      const pornrasAdmin = adminUsers?.find(a => 
        a.user_name?.toLowerCase() === 'pornras admin'
      );
      results.adminUsers.found = !!pornrasAdmin;
      
      if (adminUsers && adminUsers.length > 0) {
        console.log(`✅ ${adminUsers.length} admin kullanıcı bulundu`);
        adminUsers.forEach(a => {
          const isPornrasAdmin = a.user_name?.toLowerCase() === 'pornras admin';
          console.log(`   ${isPornrasAdmin ? '⭐' : '  '} "${a.user_name}" -> is_admin: ${a.is_admin}`);
        });
      } else {
        console.log('❌ Admin users tablosu boş!');
      }
      
      if (pornrasAdmin) {
        console.log(`\n✅ Pornras Admin admin_users tablosunda bulundu!`);
        console.log(`   is_admin: ${pornrasAdmin.is_admin}`);
      } else {
        console.log(`\n❌ Pornras Admin admin_users tablosunda bulunamadı!`);
      }
    }
  } catch (err) {
    results.adminUsers.error = err;
    console.error('❌ Exception:', err.message);
  }
  
  // Test 3: Simulate admin check function
  console.log('\n3️⃣ Admin Kontrol Fonksiyonu Simülasyonu');
  console.log('-'.repeat(50));
  
  if (results.profiles.found && results.adminUsers.found) {
    const profileUsername = results.profiles.data[0].user_name;
    const adminUser = results.adminUsers.data.find(a => 
      a.user_name?.toLowerCase() === profileUsername?.toLowerCase()
    );
    
    if (adminUser && adminUser.is_admin) {
      results.adminCheck.works = true;
      console.log('✅ Admin kontrol fonksiyonu çalışacak!');
      console.log(`   Profile username: "${profileUsername}"`);
      console.log(`   Admin check sonucu: ${adminUser.is_admin ? 'ADMIN ✅' : 'NOT ADMIN ❌'}`);
    } else {
      console.log('❌ Admin kontrol fonksiyonu çalışmayacak!');
      console.log(`   Profile username: "${profileUsername}"`);
      console.log(`   Admin_users'da eşleşme: ${adminUser ? 'Var ama is_admin=false' : 'Yok'}`);
    }
  } else {
    console.log('⚠️  Test yapılamıyor - gerekli veriler eksik');
  }
  
  // Test 4: Case-insensitive test
  console.log('\n4️⃣ Case-Insensitive Kontrol Testi');
  console.log('-'.repeat(50));
  
  if (results.adminUsers.data && results.adminUsers.data.length > 0) {
    const testCases = [
      'Pornras Admin',
      'pornras admin',
      'PORNRAS ADMIN',
      'Pornras Admin ',
      '  Pornras Admin  '
    ];
    
    testCases.forEach(testUsername => {
      const normalized = testUsername.trim().toLowerCase();
      const found = results.adminUsers.data.some(a => 
        a.user_name?.toLowerCase() === normalized && a.is_admin === true
      );
      console.log(`   ${found ? '✅' : '❌'} "${testUsername}" -> ${found ? 'ADMIN' : 'NOT ADMIN'}`);
    });
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST ÖZETİ');
  console.log('='.repeat(50));
  console.log(`Profiles tablosu: ${results.profiles.found ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Admin_users tablosu: ${results.adminUsers.found ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Admin kontrol: ${results.adminCheck.works ? '✅ OK' : '❌ FAIL'}`);
  
  if (results.profiles.found && results.adminUsers.found && results.adminCheck.works) {
    console.log('\n✅ TÜM TESTLER BAŞARILI!');
    console.log('   Admin kullanıcısı doğru kurulmuş ve çalışıyor.');
    return 0;
  } else {
    console.log('\n❌ BAZI TESTLER BAŞARISIZ!');
    console.log('   Lütfen admin kullanıcısını tekrar oluşturun:');
    console.log('   - Supabase SQL Editor\'de create_pornras_admin.sql çalıştırın');
    console.log('   - VEYA /api/auth/create-admin endpoint\'ini çağırın');
    return 1;
  }
}

// Run test
testAdminSetup()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(err => {
    console.error('\n❌ Test hatası:', err);
    process.exit(1);
  });

