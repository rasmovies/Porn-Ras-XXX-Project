const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { StreamtapeClient } = require('../_helpers/streamtape');

/**
 * Get Streamtape upload URL for direct browser upload
 * This allows FileZilla-like direct upload from browser to Streamtape
 */
module.exports = async function handler(req, res) {
  const log = (...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [GET-UPLOAD-URL]`, ...args);
  };

  try {
    log('📥 ========== get-upload-url endpoint called ==========');
    
    setCorsHeaders(res, req.headers.origin || req.headers.referer);

    if (req.method === 'OPTIONS') {
      return handleOptions(req, res);
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }

      const {
        streamtapeLogin,
        streamtapeKey,
        streamtapeCookies,
        streamtapeAuthMethod
      } = body || {};

      const useCookies = streamtapeAuthMethod === 'cookie' && streamtapeCookies;
      const useApiKey = streamtapeAuthMethod !== 'cookie' && streamtapeLogin && streamtapeKey;

      if (!useCookies && !useApiKey) {
        return res.status(400).json({
          success: false,
          message: 'Missing Streamtape credentials (need either API Key or Cookies)'
        });
      }

      // Create Streamtape client
      const streamtapeClient = useCookies 
        ? new StreamtapeClient(null, null, streamtapeCookies)
        : new StreamtapeClient(streamtapeLogin, streamtapeKey);

      // Get upload URL
      log('🔗 Getting upload URL from Streamtape...');
      const uploadUrl = await streamtapeClient.getUploadUrl();
      
      log('✅ Upload URL obtained:', uploadUrl);

      return res.json({
        success: true,
        uploadUrl: uploadUrl
      });

    } catch (error) {
      console.error('❌ Get upload URL error:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to get upload URL: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

  } catch (outerError) {
    console.error('❌ Handler error:', outerError);
    return res.status(500).json({
      success: false,
      message: `Handler failed: ${outerError.message}`,
      error: process.env.NODE_ENV === 'development' ? outerError.stack : undefined
    });
  }
};


