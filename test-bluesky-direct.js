// Bluesky API'yi manuel test etmek için script
require('dotenv').config();
const { shareVideoToBluesky } = require('./server/services/blueskyService');

async function testBluesky() {
  console.log('🧪 Bluesky API Manuel Test\n');

  // Environment variables kontrolü
  const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE;
  const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;

  if (!BLUESKY_HANDLE || !BLUESKY_PASSWORD) {
    console.error('❌ Hata: BLUESKY_HANDLE ve BLUESKY_PASSWORD environment variable\'ları ayarlanmalı!');
    console.log('\n📋 Kontrol edin:');
    console.log('1. server/.env dosyasında BLUESKY_HANDLE ve BLUESKY_PASSWORD var mı?');
    console.log('2. Vercel Dashboard → server → Settings → Environment Variables');
    process.exit(1);
  }

  console.log('✅ Environment variables bulundu');
  console.log(`   Handle: ${BLUESKY_HANDLE}`);
  console.log(`   Password: ${BLUESKY_PASSWORD ? '***' : 'YOK'}\n`);

  try {
    // Test video paylaşımı
    console.log('🎬 Test video paylaşımı yapılıyor...');
    const testVideo = await shareVideoToBluesky({
      title: 'Test Video - Manuel Test',
      description: 'Bu bir test video açıklamasıdır. Bluesky entegrasyonunu manuel olarak test ediyoruz.',
      thumbnail: 'https://via.placeholder.com/400x225/ff6b6b/ffffff?text=Test+Video',
      slug: 'test-video-manuel',
    });
    console.log('✅ Video paylaşımı başarılı:', testVideo.uri);
    console.log('🎉 Bluesky API çalışıyor!');
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testBluesky();

