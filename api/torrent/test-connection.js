const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { QBittorrentClient } = require('../_helpers/qbittorrent');

module.exports = async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin || req.headers.referer);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { url, username = '', password = '' } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: url. qBittorrent Web UI URL gerekli.'
      });
    }

    const client = new QBittorrentClient(url, username, password);
    await client.testConnection();

    return res.json({
      success: true,
      message: 'Connection successful'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    
    // Check for IP ban error
    if (error.message && error.message.includes('yasaklandı') || error.message.includes('banned')) {
      return res.status(500).json({
        success: false,
        message: 'IP adresiniz qBittorrent tarafından yasaklanmış. Çok fazla başarısız giriş denemesi yapıldı.',
        details: {
          hint: 'qBittorrent programını yeniden başlatın veya Web UI ayarlarında yasaklama süresini kontrol edin. Kullanıcı adı ve şifreyi doğru girdiğinizden emin olun.'
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to test qBittorrent connection.',
      details: {
        hint: 'qBittorrent programının çalıştığından ve Web UI\'nin aktif olduğundan emin olun. Kullanıcı adı ve şifreyi kontrol edin.'
      }
    });
  }
};

