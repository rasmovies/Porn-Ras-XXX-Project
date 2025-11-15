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
      identifier: BLUESKY_HANDLE, // Örnek: pornras.bsky.social veya pornras@proton.me
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
        // Görseli indir ve upload et
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
          
          // Bluesky görsel upload (Node.js için Buffer kullan)
          const uploadResponse = await agent.uploadBlob(imageBuffer, {
            encoding: imageMimeType,
          });

          if (uploadResponse.data) {
            postData.embed = {
              $type: 'app.bsky.embed.images',
              images: [
                {
                  image: uploadResponse.data.blob,
                  alt: text.substring(0, 200), // Alt text
                },
              ],
            };
          }
        }
      } catch (imageError) {
        console.warn('⚠️ Görsel yüklenemedi, sadece metin gönderiliyor:', imageError.message);
        // Görsel yüklenemezse sadece metin gönder
      }
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
  const { title, description, thumbnail, slug } = videoData;

  // Video URL'si oluştur
  const videoUrl = `https://www.pornras.com/video/${slug}`;

  // Post metni oluştur
  const postText = `🎬 Yeni Video: ${title}\n\n${description ? description.substring(0, 200) : ''}\n\n${videoUrl}`;

  // Bluesky'de paylaş
  return await postToBluesky(postText, thumbnail, videoUrl);
}

module.exports = {
  connectBluesky,
  postToBluesky,
  shareVideoToBluesky,
};

