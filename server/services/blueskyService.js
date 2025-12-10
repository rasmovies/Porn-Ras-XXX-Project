const { BskyAgent } = require('@atproto/api');

// Bluesky Agent instance (singleton)
let agent = null;

/**
 * Bluesky'e bağlan ve oturum aç
 */
async function connectBluesky() {
  if (agent && agent.session) {
    return agent; // Zaten bağlı
  }

  const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE;
  const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;

  if (!BLUESKY_HANDLE || !BLUESKY_PASSWORD) {
    throw new Error('BLUESKY_HANDLE ve BLUESKY_PASSWORD environment variable\'ları ayarlanmalı');
  }

  agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  try {
    await agent.login({
      identifier: BLUESKY_HANDLE, // Örnek: pornras.bsky.social
      password: BLUESKY_PASSWORD, // App Password (Uygulama Şifresi)
    });

    console.log('✅ Bluesky bağlantısı başarılı:', BLUESKY_HANDLE);
    return agent;
  } catch (error) {
    console.error('❌ Bluesky bağlantı hatası:', error.message);
    throw error;
  }
}

/**
 * Bluesky'de post yayınla
 * @param {string} text - Post metni
 * @param {string} [imageUrl] - Opsiyonel: Görsel URL'si
 * @param {string} [linkUrl] - Opsiyonel: Link URL'si
 * @returns {Promise<Object>} Post sonucu
 */
async function postToBluesky(text, imageUrl = null, linkUrl = null) {
  try {
    const agent = await connectBluesky();

    // Post içeriği oluştur
    const postData = {
      text: text,
      createdAt: new Date().toISOString(),
    };

    // Link varsa metne ekle
    if (linkUrl) {
      postData.text = `${text}\n\n🔗 ${linkUrl}`;
    }

    // Görsel varsa ekle (Bluesky görsel upload gerektirir)
    if (imageUrl) {
      try {
        console.log('📸 Thumbnail yükleniyor:', imageUrl);
        
        // Görseli indir ve upload et
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          console.log('📸 Görsel indirildi, MIME type:', imageMimeType, 'Size:', imageBuffer.length, 'bytes');
          
          // Bluesky görsel upload (Node.js için Buffer kullan)
          // @atproto/api'de uploadBlob için doğru parametre mimeType
          const uploadResponse = await agent.uploadBlob(imageBuffer, {
            mimeType: imageMimeType,
          });

          if (uploadResponse.data && uploadResponse.data.blob) {
            console.log('✅ Thumbnail Bluesky\'e yüklendi');
            postData.embed = {
              $type: 'app.bsky.embed.images',
              images: [
                {
                  image: uploadResponse.data.blob,
                  alt: text.substring(0, 200), // Alt text (Bluesky için max 1000 karakter)
                },
              ],
            };
          } else {
            console.warn('⚠️ Upload response\'da blob bulunamadı:', uploadResponse);
          }
        } else {
          console.warn('⚠️ Görsel indirilemedi, status:', imageResponse.status);
        }
      } catch (imageError) {
        console.error('❌ Görsel yükleme hatası:', imageError.message);
        console.error('❌ Error stack:', imageError.stack);
        // Görsel yüklenemezse sadece metin gönder (post devam eder)
      }
    } else {
      console.log('ℹ️ Thumbnail URL yok, sadece metin gönderiliyor');
    }

    // Post'u yayınla
    const result = await agent.post(postData);

    console.log('✅ Bluesky post başarılı:', result.uri);
    return {
      success: true,
      uri: result.uri,
      cid: result.cid,
    };
  } catch (error) {
    console.error('❌ Bluesky post hatası:', error.message);
    throw error;
  }
}

/**
 * Video paylaşımı için özel fonksiyon
 * @param {Object} videoData - Video bilgileri
 * @param {string} videoData.title - Video başlığı
 * @param {string} videoData.description - Video açıklaması
 * @param {string} videoData.thumbnail - Thumbnail URL'si
 * @param {string} videoData.slug - Video slug (URL için)
 * @returns {Promise<Object>} Post sonucu
 */
async function shareVideoToBluesky(videoData) {
  const { title, description, thumbnail, slug, modelName, categoryName } = videoData;

  // Video URL'si oluştur (environment variable'dan al veya production URL kullan)
  const baseUrl = process.env.SITE_BASE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : (process.env.NODE_ENV === 'production' 
      ? 'https://www.pornras.com' 
      : 'http://localhost:3000');
  const videoUrl = `${baseUrl}/video/${slug}`;

  // Post metni oluştur (Bluesky 300 karakter limiti var, bu yüzden kısalt)
  const maxDescriptionLength = 120; // Link, başlık ve hashtag'ler için yer bırak
  const truncatedDescription = description 
    ? description.substring(0, maxDescriptionLength) + (description.length > maxDescriptionLength ? '...' : '')
    : '';
  
  // Hashtag'leri oluştur (model ve kategori isimlerini hashtag formatına çevir)
  const hashtags = [];
  if (modelName) {
    // Model ismini hashtag formatına çevir (boşlukları kaldır, küçük harfe çevir)
    const modelHashtag = `#${modelName.replace(/\s+/g, '').toLowerCase()}`;
    hashtags.push(modelHashtag);
  }
  if (categoryName) {
    // Kategori ismini hashtag formatına çevir
    const categoryHashtag = `#${categoryName.replace(/\s+/g, '').toLowerCase()}`;
    hashtags.push(categoryHashtag);
  }
  
  // Post metnini oluştur
  let postText = `🎬 Yeni Video: ${title}`;
  if (truncatedDescription) {
    postText += `\n\n${truncatedDescription}`;
  }
  if (hashtags.length > 0) {
    postText += `\n\n${hashtags.join(' ')}`;
  }
  postText += `\n\n🔗 ${videoUrl}`;

  // Bluesky'de paylaş
  return await postToBluesky(postText, thumbnail, videoUrl);
}

module.exports = {
  connectBluesky,
  postToBluesky,
  shareVideoToBluesky,
};

