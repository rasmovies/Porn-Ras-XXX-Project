/**
 * qBittorrent Web UI API Helper
 * https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation
 */

const axios = require('axios');

class QBittorrentClient {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.username = username;
    this.password = password;
    this.sid = null; // Session ID
  }

  /**
   * Login to qBittorrent Web UI
   */
  async login() {
    try {
      // If username/password are empty, qBittorrent might not require auth
      // Try to login with provided credentials first
      const params = {};
      if (this.username && this.username.trim()) {
        params.username = this.username;
      }
      if (this.password && this.password.trim()) {
        params.password = this.password;
      }
      
      const response = await axios.post(
        `${this.baseUrl}/api/v2/auth/login`,
        null,
        {
          params: params,
          maxRedirects: 0,
          validateStatus: (status) => status === 200 || status === 302 || status === 403,
        }
      );

      // Extract session ID from cookies
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        for (const cookie of cookies) {
          const match = cookie.match(/SID=([^;]+)/);
          if (match) {
            this.sid = match[1];
            return true;
          }
        }
      }

      // Alternative: Check if login was successful (200 OK means success, 403 means failure)
      if (response.status === 200 && (response.data === 'Ok.' || response.data === 'Fails.')) {
        // 'Ok.' means success, 'Fails.' means wrong credentials
        if (response.data === 'Ok.') {
          return true;
        } else {
          throw new Error('Kullanıcı adı veya şifre yanlış. qBittorrent Web UI ayarlarını kontrol edin.');
        }
      }
      
      // If we got 403, credentials are wrong or auth is required but not provided
      if (response.status === 403) {
        if (!this.username || !this.password) {
          throw new Error('Web UI için kullanıcı adı ve şifre gerekiyor. qBittorrent → Options → Web UI\'de kullanıcı adı ve şifre ayarlayın veya mevcut bilgileri girin.');
        } else {
          throw new Error('Kullanıcı adı veya şifre yanlış. Lütfen qBittorrent Web UI ayarlarını kontrol edin.');
        }
      }

      return false;
    } catch (error) {
      console.error('qBittorrent login error:', error.message);
      
      // Check for IP ban (Turkish error message)
      if (error.response && error.response.data && typeof error.response.data === 'string') {
        if (error.response.data.includes('yasaklandı') || error.response.data.includes('banned')) {
          throw new Error('IP adresiniz çok fazla başarısız giriş denemesinden sonra yasaklandı. qBittorrent programını yeniden başlatın veya Web UI ayarlarında yasaklama süresini bekleyin.');
        }
      }
      
      // If error message already contains our custom message, throw it as is
      if (error.message.includes('Kullanıcı adı') || error.message.includes('Web UI') || error.message.includes('yasaklandı')) {
        throw error;
      }
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Make authenticated API request
   */
  async request(method, endpoint, data = null, params = null) {
    try {
      // Login if not already logged in
      if (!this.sid) {
        await this.login();
      }

      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `SID=${this.sid}`,
          'Referer': this.baseUrl,
        },
      };

      if (params) {
        config.params = params;
      }

      if (data) {
        if (method === 'POST' || method === 'PUT') {
          // Convert object to URL-encoded format
          const formData = new URLSearchParams();
          for (const key in data) {
            if (data[key] !== null && data[key] !== undefined) {
              formData.append(key, data[key]);
            }
          }
          config.data = formData.toString();
        }
      }

      const response = await axios(config);

      // If unauthorized, try to login again
      if (response.status === 403 || response.data === 'Forbidden') {
        await this.login();
        // Retry request
        return this.request(method, endpoint, data, params);
      }

      return response.data;
    } catch (error) {
      console.error('qBittorrent API request error:', error.message);
      
      // If unauthorized, try to login again
      if (error.response && error.response.status === 403) {
        await this.login();
        // Retry request
        return this.request(method, endpoint, data, params);
      }
      
      throw error;
    }
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      const loggedIn = await this.login();
      if (!loggedIn) {
        throw new Error('Login failed');
      }
      return true;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Add torrent from URL or magnet link
   */
  async addTorrent(torrentUrl, options = {}) {
    try {
      const {
        category = '',
        tags = '',
        savepath = '',
        paused = false,
      } = options;

      const data = {
        urls: torrentUrl,
        category,
        tags,
        savepath,
        paused: paused ? 'true' : 'false',
      };

      await this.request('POST', '/api/v2/torrents/add', data);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to add torrent: ${error.message}`);
    }
  }

  /**
   * Get torrent list
   */
  async getTorrentList(filter = 'all') {
    try {
      const data = await this.request('GET', '/api/v2/torrents/info', null, { filter });
      
      // Format torrent data
      return data.map(torrent => ({
        hash: torrent.hash,
        name: torrent.name,
        size: torrent.size,
        progress: torrent.progress * 100, // Convert to percentage
        state: torrent.state,
        category: torrent.category,
        tags: torrent.tags,
        added_on: torrent.added_on,
        completed_on: torrent.completed_on,
        download_speed: torrent.dlspeed,
        upload_speed: torrent.upspeed,
        eta: torrent.eta,
        ratio: torrent.ratio,
        completed: torrent.completed,
        path: torrent.content_path || torrent.save_path,
      }));
    } catch (error) {
      throw new Error(`Failed to get torrent list: ${error.message}`);
    }
  }

  /**
   * Get torrent properties
   */
  async getTorrentProperties(hash) {
    try {
      const data = await this.request('GET', '/api/v2/torrents/properties', null, { hash });
      return data;
    } catch (error) {
      throw new Error(`Failed to get torrent properties: ${error.message}`);
    }
  }

  /**
   * Check if torrent is completed
   */
  async isTorrentCompleted(hash) {
    try {
      const torrents = await this.getTorrentList('completed');
      return torrents.some(t => t.hash === hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get torrent download path
   */
  async getTorrentPath(hash) {
    try {
      const properties = await this.getTorrentProperties(hash);
      return properties.content_path || properties.save_path;
    } catch (error) {
      return null;
    }
  }
}

module.exports = { QBittorrentClient };

