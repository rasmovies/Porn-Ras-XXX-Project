const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { QBittorrentClient } = require('../_helpers/qbittorrent');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape torrent from xxxclub.to
 */
async function scrapeTorrent(xxxclubUrl) {
  try {
    console.log('🔍 Scraping URL:', xxxclubUrl);
    
    // Build URL with referer
    const urlObj = new URL(xxxclubUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    let response;
    try {
      response = await axios.get(xxxclubUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Referer': baseUrl,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000,
        maxRedirects: 5
      });
    } catch (axiosError) {
      // Handle axios errors (including 403)
      if (axiosError.response) {
        const status = axiosError.response.status;
        if (status === 403) {
          throw new Error('Access forbidden (403). xxxclub.to is blocking automated requests. This site uses anti-bot protection (like Cloudflare). Please copy the magnet link manually from the browser and paste it directly in the "Torrent URL" field.');
        }
        throw new Error(`HTTP ${status}: ${axiosError.response.statusText}`);
      }
      throw axiosError;
    }
    
    // Check for 403 or other error status
    if (response.status === 403) {
      throw new Error('Access forbidden (403). xxxclub.to is blocking automated requests. Please copy the magnet link manually from the browser and paste it directly.');
    }
    
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    
    console.log('✅ Response received, status:', response.status);

    const $ = cheerio.load(response.data);
    
    // Try to find magnet link
    let magnetLink = null;
    
    // Common selectors for magnet links
    const magnetSelectors = [
      'a[href^="magnet:"]',
      'a[href*="magnet"]',
      '.magnet-link',
      '.download-magnet',
      '#magnet-link'
    ];

    for (const selector of magnetSelectors) {
      const link = $(selector).first().attr('href');
      if (link && link.startsWith('magnet:')) {
        magnetLink = link;
        break;
      }
    }

    // If no magnet link found, try to find .torrent file link
    if (!magnetLink) {
      const torrentSelectors = [
        'a[href$=".torrent"]',
        'a.download-torrent',
        '.torrent-link'
      ];

      for (const selector of torrentSelectors) {
        const link = $(selector).first().attr('href');
        if (link && (link.includes('.torrent') || link.includes('download'))) {
          // Make absolute URL if relative
          magnetLink = link.startsWith('http') ? link : new URL(link, xxxclubUrl).href;
          break;
        }
      }
    }

    if (!magnetLink) {
      // Try to extract from page content/text
      const pageText = response.data;
      const magnetMatch = pageText.match(/magnet:\?[^\s"<>]+/i);
      if (magnetMatch) {
        magnetLink = magnetMatch[0];
      }
    }

    if (!magnetLink) {
      console.error('❌ Torrent link not found on page');
      console.error('📄 Page content preview:', response.data.substring(0, 500));
      throw new Error('Torrent link not found on page. Please check the URL and try again.');
    }

    console.log('✅ Torrent link found:', magnetLink.substring(0, 100) + '...');
    
    return {
      success: true,
      torrentUrl: magnetLink,
      source: xxxclubUrl
    };
  } catch (error) {
    console.error('❌ Scrape torrent error:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle specific error cases
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      if (status === 403) {
        throw new Error(`Access forbidden (403). xxxclub.to is blocking the request. This may be due to anti-bot protection. Please try accessing the page manually in a browser first.`);
      } else if (status === 404) {
        throw new Error(`Page not found (404). Please check the URL: ${xxxclubUrl}`);
      } else {
        throw new Error(`HTTP error ${status}: ${statusText}`);
      }
    } else if (error.request) {
      // Request made but no response received
      throw new Error(`No response received from server. Please check your internet connection and try again.`);
    } else {
      // Error setting up the request
      throw new Error(`Failed to scrape torrent: ${error.message}`);
    }
  }
}

module.exports = async function handler(req, res) {
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

    const { url, username, password, xxxclubUrl, autoUploadToStreamtape, method } = body;

    if (!xxxclubUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: xxxclubUrl'
      });
    }

    // Validate xxxclub.to URL
    if (!xxxclubUrl.includes('xxxclub.to')) {
      // Check if it's a magnet link
      if (xxxclubUrl && xxxclubUrl.startsWith('magnet:')) {
        return res.status(400).json({
          success: false,
          message: 'Magnet link algılandı! Bu alan sadece xxxclub.to sayfa URL\'leri için kullanılır. Magnet linki doğrudan eklemek için "Torrent URL" alanını kullanın.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Invalid xxxclub.to URL. Expected a URL like "https://xxxclub.to/torrents/...", but received: ${xxxclubUrl.substring(0, 50)}${xxxclubUrl.length > 50 ? '...' : ''}`
      });
    }

    // Scrape torrent from xxxclub.to
    const scrapeResult = await scrapeTorrent(xxxclubUrl);

    if (!scrapeResult.success || !scrapeResult.torrentUrl) {
      return res.status(404).json({
        success: false,
        message: 'Torrent link not found on page'
      });
    }

    // If method is 'webui', add torrent using Web UI API
    if (method === 'webui') {
      if (!url || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters for Web UI method: url, username, password'
        });
      }

      const client = new QBittorrentClient(url, username, password);
      await client.addTorrent(scrapeResult.torrentUrl, {
        paused: false
      });

      return res.json({
        success: true,
        message: 'Torrent scraped and added successfully via Web UI',
        torrentUrl: scrapeResult.torrentUrl,
        autoUploadEnabled: autoUploadToStreamtape || false
      });
    }

    // For watch-folder method, just return the torrent URL
    // The frontend will handle adding it via watch-folder endpoint
    return res.json({
      success: true,
      message: 'Torrent URL scraped successfully',
      torrentUrl: scrapeResult.torrentUrl,
      source: xxxclubUrl
    });
  } catch (error) {
    console.error('❌ Scrape error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request body:', req.body);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error.message && error.message.includes('403')) {
      statusCode = 403;
    } else if (error.message && error.message.includes('404')) {
      statusCode = 404;
    } else if (error.message && error.message.includes('400')) {
      statusCode = 400;
    }
    
    // Return more detailed error information
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to scrape and add torrent',
      error: error.toString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

