/**
 * Supabase Bağlantı Test Script
 * Bu script Supabase bağlantısını ve veri çekmeyi test eder
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rjjzviliwwlbjxfnpxsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqanp2aWxpd3dsYmp4Zm5weHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTE0OTMsImV4cCI6MjA3NDQ2NzQ5M30.Mz1QxAZZz6POk7M5B8n9oM0-Pi2jSFJDLzhTT7cwPPE';

console.log('🔍 Supabase Bağlantı Testi Başlatılıyor...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 30) + '...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('='.repeat(60));
  console.log('1️⃣ Bağlantı Testi');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Basit bir query
    console.log('\n📋 Test 1: Profiles tablosunu kontrol et...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles hatası:', profilesError.message);
      console.error('   Code:', profilesError.code);
      console.error('   Details:', profilesError.details);
      console.error('   Hint:', profilesError.hint);
    } else {
      console.log('✅ Profiles başarılı!');
      console.log('   Bulunan kayıt sayısı:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('   İlk kayıt:', profiles[0].user_name);
      }
    }
    
    // Test 2: Videos tablosu
    console.log('\n📋 Test 2: Videos tablosunu kontrol et...');
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .limit(5);
    
    if (videosError) {
      console.error('❌ Videos hatası:', videosError.message);
      console.error('   Code:', videosError.code);
      console.error('   Details:', videosError.details);
      console.error('   Hint:', videosError.hint);
    } else {
      console.log('✅ Videos başarılı!');
      console.log('   Bulunan kayıt sayısı:', videos?.length || 0);
      if (videos && videos.length > 0) {
        console.log('   İlk video:', videos[0].title);
      }
    }
    
    // Test 3: Models tablosu
    console.log('\n📋 Test 3: Models tablosunu kontrol et...');
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*')
      .limit(5);
    
    if (modelsError) {
      console.error('❌ Models hatası:', modelsError.message);
      console.error('   Code:', modelsError.code);
      console.error('   Details:', modelsError.details);
      console.error('   Hint:', modelsError.hint);
    } else {
      console.log('✅ Models başarılı!');
      console.log('   Bulunan kayıt sayısı:', models?.length || 0);
      if (models && models.length > 0) {
        console.log('   İlk model:', models[0].name);
      }
    }
    
    // Test 4: Categories tablosu
    console.log('\n📋 Test 4: Categories tablosunu kontrol et...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (categoriesError) {
      console.error('❌ Categories hatası:', categoriesError.message);
      console.error('   Code:', categoriesError.code);
      console.error('   Details:', categoriesError.details);
      console.error('   Hint:', categoriesError.hint);
    } else {
      console.log('✅ Categories başarılı!');
      console.log('   Bulunan kayıt sayısı:', categories?.length || 0);
      if (categories && categories.length > 0) {
        console.log('   İlk kategori:', categories[0].name);
      }
    }
    
    // Test 5: Channels tablosu
    console.log('\n📋 Test 5: Channels tablosunu kontrol et...');
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .limit(5);
    
    if (channelsError) {
      console.error('❌ Channels hatası:', channelsError.message);
      console.error('   Code:', channelsError.code);
      console.error('   Details:', channelsError.details);
      console.error('   Hint:', channelsError.hint);
    } else {
      console.log('✅ Channels başarılı!');
      console.log('   Bulunan kayıt sayısı:', channels?.length || 0);
      if (channels && channels.length > 0) {
        console.log('   İlk channel:', channels[0].name);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ÖZET');
    console.log('='.repeat(60));
    console.log('Profiles:', profilesError ? '❌' : '✅', profiles?.length || 0, 'kayıt');
    console.log('Videos:', videosError ? '❌' : '✅', videos?.length || 0, 'kayıt');
    console.log('Models:', modelsError ? '❌' : '✅', models?.length || 0, 'kayıt');
    console.log('Categories:', categoriesError ? '❌' : '✅', categories?.length || 0, 'kayıt');
    console.log('Channels:', channelsError ? '❌' : '✅', channels?.length || 0, 'kayıt');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testConnection().catch(console.error);
