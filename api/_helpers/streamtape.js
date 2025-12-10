/**
 * Streamtape API Helper
 * Upload files to Streamtape and get embed URLs
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

class StreamtapeClient {
  constructor(login, key, cookies = null) {
    this.login = login;
    this.key = key;
    // Clean and sanitize cookies to remove invalid characters
    this.cookies = cookies ? this.sanitizeCookies(cookies) : null;
    this.baseUrl = 'https://api.streamtape.com';
    this.useCookies = !!(cookies && !login && !key); // Use cookies if no login/key provided
  }

  /**
   * Parse tab-separated cookie format to standard cookie format
   * Converts: "name\tvalue\tdomain..." to "name=value"
   */
  parseTabSeparatedCookies(cookieString) {
    const lines = cookieString.split(/\r?\n/).filter(line => line.trim());
    const cookies = [];
    
    for (const line of lines) {
      const parts = line.split(/\t/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts[1].trim();
        if (name && value) {
          cookies.push(`${name}=${value}`);
        }
      }
    }
    
    return cookies.join('; ');
  }

  /**
   * Sanitize cookie string to remove invalid characters
   * HTTP headers cannot contain newlines, carriage returns, or certain special characters
   */
  sanitizeCookies(cookieString) {
    if (!cookieString || typeof cookieString !== 'string') {
      return null;
    }
    
    // Check if cookie string is tab-separated format (from browser cookie export)
    // Tab-separated format: "name\tvalue\tdomain..."
    const isTabSeparated = cookieString.includes('\t') && cookieString.includes('\n');
    if (isTabSeparated) {
      console.log('📋 Detected tab-separated cookie format, converting to standard format...');
      cookieString = this.parseTabSeparatedCookies(cookieString);
    }
    
    let cleaned = cookieString
      .trim() // Remove leading/trailing whitespace
      .replace(/\r\n/g, ' ') // Replace Windows line endings with space
      .replace(/\n/g, ' ') // Replace Unix line endings with space
      .replace(/\r/g, ' ') // Replace carriage returns with space
      .replace(/\t/g, ' ') // Replace tabs with space
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Final trim
    
    // Additional validation: ensure cookie format is valid
    // Cookie header should be: name=value; name2=value2
    // Remove any invalid cookie characters at the start/end
    cleaned = cleaned.replace(/^[;,\s]+|[;,\s]+$/g, ''); // Remove leading/trailing semicolons, commas, spaces
    
    // Check if cookie contains at least one = sign (cookie format requirement)
    if (!cleaned.includes('=')) {
      console.warn('⚠️ Cookie string does not contain "=" - may be invalid format');
      return null;
    }
    
    return cleaned;
  }

  /**
   * Validate URL format
   */
  isValidUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') {
      return false;
    }
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  /**
   * Get upload URL
   */
  async getUploadUrl() {
    try {
      // Prepare request config
      const config = {
        params: {},
        headers: {}
      };

      // If using cookies, add them to headers (already sanitized in constructor)
      if (this.useCookies && this.cookies) {
        // Additional sanitization check before adding to headers
        const finalCookies = this.sanitizeCookies(this.cookies);
        if (!finalCookies || finalCookies.length === 0) {
          throw new Error('Cookie string is empty after sanitization. Please check cookie format.');
        }
        // Validate cookie string doesn't contain invalid characters for HTTP headers
        if (finalCookies.includes('\n') || finalCookies.includes('\r')) {
          throw new Error('Cookie string contains invalid characters (newlines). Please check cookie format.');
        }
        config.headers['Cookie'] = finalCookies;
        console.log('🔗 Requesting upload URL with cookies...');
        
        // Try to get upload URL using cookies
        // Note: Streamtape API might need different endpoint for cookie-based auth
        const response = await axios.get(`${this.baseUrl}/file/ul`, config);
        
        console.log('📥 Streamtape API response:', {
          status: response.status,
          dataStatus: response.data?.status,
          hasResult: !!response.data?.result,
          resultMsg: response.data?.result?.msg
        });
        
        if (response.data && response.data.status === 200 && response.data.result) {
          // Streamtape API returns upload URL in result.url (not result.msg)
          const uploadUrl = response.data.result.url || response.data.result.msg;
          
          if (!uploadUrl) {
            console.error('❌ No upload URL in API response. Response:', JSON.stringify(response.data));
            throw new Error(`No upload URL in API response. API returned: ${JSON.stringify(response.data)}`);
          }
          
          // Validate URL format
          if (!this.isValidUrl(uploadUrl)) {
            console.error('❌ Invalid upload URL format:', uploadUrl);
            throw new Error(`Invalid upload URL format received from Streamtape API: ${uploadUrl}. Please check your cookies and try again.`);
          }
          
          console.log('✅ Upload URL obtained:', uploadUrl);
          console.log('📅 Valid until:', response.data.result.valid_until || 'N/A');
          return uploadUrl;
        }
        
        console.error('❌ Failed to get upload URL with cookies. Response:', JSON.stringify(response.data));
        throw new Error(`Failed to get upload URL with cookies. API returned: ${JSON.stringify(response.data)}`);
      } else if (this.login && this.key) {
        // Use API Key method (original)
        config.params = {
          login: this.login,
          key: this.key
        };
        console.log('🔗 Requesting upload URL with API key...');
        const response = await axios.get(`${this.baseUrl}/file/ul`, config);
        
        console.log('📥 Streamtape API response:', {
          status: response.status,
          dataStatus: response.data?.status,
          hasResult: !!response.data?.result,
          resultMsg: response.data?.result?.msg
        });
        
        if (response.data && response.data.status === 200 && response.data.result) {
          // Streamtape API returns upload URL in result.url (not result.msg)
          const uploadUrl = response.data.result.url || response.data.result.msg;
          
          if (!uploadUrl) {
            console.error('❌ No upload URL in API response. Response:', JSON.stringify(response.data));
            throw new Error(`No upload URL in API response. API returned: ${JSON.stringify(response.data)}`);
          }
          
          // Validate URL format
          if (!this.isValidUrl(uploadUrl)) {
            console.error('❌ Invalid upload URL format:', uploadUrl);
            throw new Error(`Invalid upload URL format received from Streamtape API: ${uploadUrl}. Please check your API credentials.`);
          }
          
          console.log('✅ Upload URL obtained:', uploadUrl);
          console.log('📅 Valid until:', response.data.result.valid_until || 'N/A');
          return uploadUrl;
        }
        
        console.error('❌ Failed to get upload URL. Response:', JSON.stringify(response.data));
        throw new Error(`Failed to get upload URL. API returned: ${JSON.stringify(response.data)}`);
      } else {
        throw new Error('No authentication method provided (need login+key or cookies)');
      }
    } catch (error) {
      // Check if it's already our formatted error
      if (error.message.includes('Invalid upload URL') || error.message.includes('Failed to get upload URL')) {
        throw error;
      }
      
      // Check for axios errors
      if (error.response) {
        console.error('❌ Streamtape API error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        throw new Error(`Streamtape API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      
      throw new Error(`Streamtape API error: ${error.message}`);
    }
  }

  /**
   * Upload file to Streamtape
   */
  async uploadFile(filePath, filename = null, onProgress = null) {
    try {
      // Check if file exists
      if (!fsSync.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Get upload URL
      const uploadUrl = await this.getUploadUrl();
      
      // Validate upload URL before proceeding
      if (!this.isValidUrl(uploadUrl)) {
        throw new Error(`Invalid upload URL: ${uploadUrl}`);
      }
      
      // Read file stats
      const stats = fsSync.statSync(filePath);
      const fileSize = stats.size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      
      console.log(`📤 Uploading file: ${filename || path.basename(filePath)} (${fileSizeMB} MB)`);
      console.log(`📤 Upload URL: ${uploadUrl}`);
      
      // Read file as buffer for better handling
      const fileBuffer = await fs.readFile(filePath);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: filename || path.basename(filePath),
        contentType: 'application/octet-stream',
        knownLength: fileSize
      });

      // Upload file
      const uploadHeaders = {
        ...formData.getHeaders(),
        'Content-Length': fileSize
      };
      
      // Add cookies to upload request if using cookie-based auth (already sanitized)
      if (this.useCookies && this.cookies) {
        // Additional sanitization check before adding to headers
        const finalCookies = this.sanitizeCookies(this.cookies);
        if (!finalCookies || finalCookies.length === 0) {
          throw new Error('Cookie string is empty after sanitization. Please check cookie format.');
        }
        // Validate cookie string doesn't contain invalid characters for HTTP headers
        if (finalCookies.includes('\n') || finalCookies.includes('\r')) {
          throw new Error('Cookie string contains invalid characters (newlines). Please check cookie format.');
        }
        uploadHeaders['Cookie'] = finalCookies;
      }
      
      // Configure progress tracking with extended timeout
      const config = {
        headers: uploadHeaders,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 900000 // 15 minutes (900 seconds) - matches Vercel maxDuration
      };
      
      // Add progress callback if provided
      if (onProgress && typeof onProgress === 'function') {
        config.onUploadProgress = (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const loadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(2);
            const totalMB = (progressEvent.total / (1024 * 1024)).toFixed(2);
            const speedMBps = progressEvent.rate ? (progressEvent.rate / (1024 * 1024)).toFixed(2) : null;
            
            // Call progress callback
            onProgress({
              percent: percentCompleted,
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              loadedMB: parseFloat(loadedMB),
              totalMB: parseFloat(totalMB),
              speedMBps: speedMBps ? parseFloat(speedMBps) : null
            });
            
            // Log progress to console
            const progressBar = '█'.repeat(Math.floor(percentCompleted / 2)) + '░'.repeat(50 - Math.floor(percentCompleted / 2));
            let progressMsg = `📊 [${progressBar}] ${percentCompleted}% (${loadedMB} MB / ${totalMB} MB)`;
            if (speedMBps) {
              progressMsg += ` - ${speedMBps} MB/s`;
            }
            console.log(progressMsg);
            
            // Special logging when upload reaches 100%
            if (percentCompleted >= 100) {
              console.log('🎯 Upload progress reached 100%! This means file data is sent, but waiting for Streamtape server to process and respond...');
              console.log('⏳ Note: Progress 100% = upload complete, but server may take time to process and return file ID');
            }
          }
        };
      }
      
      // Increase timeout for large file uploads (up to 15 minutes)
      config.timeout = 900000; // 15 minutes in milliseconds
      
      console.log('📤 Starting Streamtape upload POST request...');
      console.log('📤 Upload URL:', uploadUrl);
      console.log('📤 Timeout:', config.timeout, 'ms (15 minutes)');
      console.log('📤 File size:', fileSizeMB, 'MB');
      console.log('⏳ Upload may take several minutes. Please wait...');
      
      const uploadStartTime = Date.now();
      
      // Add periodic status logging while waiting for response
      const statusInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - uploadStartTime) / 1000);
        console.log(`⏳ Still waiting for Streamtape response... (${elapsed}s elapsed)`);
      }, 30000); // Log every 30 seconds
      
      let response;
      try {
        console.log('🔄 Calling axios.post... This may take several minutes for large files...');
        response = await axios.post(uploadUrl, formData, config);
        clearInterval(statusInterval); // Stop status logging on success
        const uploadDuration = Math.round((Date.now() - uploadStartTime) / 1000);
        console.log(`✅ Streamtape upload POST request completed successfully! (Took ${uploadDuration}s)`);
      } catch (axiosError) {
        clearInterval(statusInterval); // Stop status logging on error
        console.error('❌ Streamtape upload POST request failed!');
        console.error('❌ Error name:', axiosError.name);
        console.error('❌ Error message:', axiosError.message);
        console.error('❌ Error code:', axiosError.code);
        
        const uploadDuration = Math.round((Date.now() - uploadStartTime) / 1000);
        console.error(`❌ Upload failed after ${uploadDuration} seconds`);
        
        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          console.error('❌ TIMEOUT ERROR: Streamtape did not respond within 15 minutes');
          console.error('❌ This usually means:');
          console.error('   1. Streamtape server is slow or overloaded');
          console.error('   2. File is very large and needs more processing time');
          console.error('   3. Network connection issue');
          console.error('   4. Streamtape server did not process the file');
        }
        
        if (axiosError.response) {
          console.error('❌ Response status:', axiosError.response.status);
          console.error('❌ Response data:', axiosError.response.data);
        } else if (axiosError.request) {
          console.error('❌ Request was made but no response received');
          console.error('❌ Request details:', axiosError.request);
          console.error('❌ This usually means Streamtape server did not respond at all');
        }
        
        throw new Error(`Streamtape upload failed: ${axiosError.message}`);
      } finally {
        // Ensure interval is cleared even if something unexpected happens
        clearInterval(statusInterval);
      }

      // Parse response with detailed logging
      console.log('📥 Streamtape upload response status:', response.status);
      console.log('📥 Streamtape upload response headers:', response.headers);
      console.log('📥 Streamtape upload response data type:', typeof response.data);
      console.log('📥 Streamtape upload response data (raw):', response.data);
      
      // Check if response status is successful (200-299)
      if (response.status < 200 || response.status >= 300) {
        console.error('❌ Streamtape upload failed with HTTP status:', response.status);
        throw new Error(`Streamtape upload failed with HTTP status ${response.status}`);
      }
      
      let result;
      if (typeof response.data === 'string') {
        try {
          result = JSON.parse(response.data);
          console.log('📥 Parsed JSON response:', result);
        } catch (e) {
          console.error('❌ Failed to parse response as JSON:', e);
          console.error('❌ Raw response data:', response.data);
          result = { status: response.status, data: response.data };
        }
      } else {
        result = response.data;
      }

      // Log full response for debugging
      console.log('📥 Full Streamtape upload result:', JSON.stringify(result, null, 2));
      console.log('📥 Full Streamtape upload result (object keys):', Object.keys(result || {}));
      if (result.result) {
        console.log('📥 Result object keys:', Object.keys(result.result || {}));
      }

      // Check various response formats that Streamtape might return
      let fileId = null;
      let fileUrl = null;
      let embedUrl = null;
      
      // Try to extract file ID from various possible response formats
      // Streamtape can return different formats depending on the API version
      
      // Format 1: { status: 200, result: { id: "...", url: "..." } }
      // Format 2: { status: 200, result: { fileid: "...", file_url: "..." } }
      // Format 3: { id: "...", url: "..." }
      // Format 4: { fileid: "...", file_url: "..." }
      // Format 5: { status: 200, msg: "...", url: "..." }
      // Format 6: { status: 200, result: { msg: "File uploaded", url: "..." } }
      
      // Try result object first
      if (result.result) {
        // Try various ID field names
        fileId = result.result.id || result.result.fileid || result.result.file_id || result.result.fid || 
                 result.result.vid || result.result.video_id;
        
        // Try various URL field names
        fileUrl = result.result.url || result.result.file_url || result.result.download_url || 
                  result.result.link || result.result.video_url;
        
        // Try embed URL
        embedUrl = result.result.embed_url || result.result.embedUrl || result.result.embed || 
                   result.result.player_url || result.result.player;
        
        // If we have a URL but no ID, try to extract ID from URL
        if (!fileId && fileUrl) {
          const urlMatch = fileUrl.match(/[\/v|e|d]+\/([a-zA-Z0-9]+)/);
          if (urlMatch && urlMatch[1]) {
            fileId = urlMatch[1];
            console.log('📋 Extracted file ID from URL:', fileId);
          }
        }
      }
      
      // Try root level fields if not found in result
      if (!fileId) {
        fileId = result.id || result.fileid || result.file_id || result.fid || 
                 result.vid || result.video_id;
        fileUrl = result.url || result.file_url || result.download_url || 
                  result.link || result.video_url;
        embedUrl = result.embed_url || result.embedUrl || result.embed || 
                   result.player_url || result.player;
      }
      
      // Try to extract from msg field (sometimes contains URL)
      if (!fileId && result.msg && typeof result.msg === 'string') {
        const urlMatch = result.msg.match(/https?:\/\/[^\s]+/);
        if (urlMatch && urlMatch[0]) {
          fileUrl = urlMatch[0];
          const idMatch = fileUrl.match(/[\/v|e|d]+\/([a-zA-Z0-9]+)/);
          if (idMatch && idMatch[1]) {
            fileId = idMatch[1];
            console.log('📋 Extracted file ID from msg URL:', fileId);
          }
        }
      }
      
      // If we have fileId, construct URLs
      if (fileId) {
        if (!embedUrl) {
          embedUrl = `https://streamtape.com/e/${fileId}/`;
        }
        if (!fileUrl) {
          fileUrl = `https://streamtape.com/v/${fileId}/`;
        }
        
        console.log('✅ Streamtape upload successful!');
        console.log('   File ID:', fileId);
        console.log('   Embed URL:', embedUrl);
        console.log('   File URL:', fileUrl);
        
        return {
          success: true,
          fileId: fileId,
          fileUrl: fileUrl,
          embedUrl: embedUrl
        };
      } else {
        // Log detailed response for debugging
        console.error('❌ File ID not found in response. Full response:', JSON.stringify(result, null, 2));
        console.error('❌ Response keys:', Object.keys(result || {}));
        if (result.result) {
          console.error('❌ Result keys:', Object.keys(result.result || {}));
        }
      }

      // If we get here, upload might have failed or response format is unexpected
      console.error('❌ Upload response format unexpected or failed:', JSON.stringify(result, null, 2));
      throw new Error(`Upload failed or response format unexpected. Response: ${JSON.stringify(result)}`);
    } catch (error) {
      throw new Error(`Streamtape upload error: ${error.message}`);
    }
  }

  /**
   * Remote upload - Upload file from URL to Streamtape
   * This is much faster and doesn't require local file system access
   * 
   * @param {string} fileUrl - Direct URL to the file to upload
   * @param {string} folderId - Optional folder ID to upload to
   * @returns {Promise<Object>} Upload result with fileId, embedUrl, etc.
   */
  async remoteUpload(fileUrl, folderId = null) {
    try {
      console.log('📤 Starting remote upload from URL:', fileUrl);
      
      // Prepare request config
      const config = {
        params: {
          url: fileUrl
        },
        headers: {}
      };
      
      // Add folder ID if provided
      if (folderId) {
        config.params.folder = folderId;
      }
      
      // Use cookies or API key for authentication
      if (this.useCookies && this.cookies) {
        const finalCookies = this.sanitizeCookies(this.cookies);
        if (!finalCookies || finalCookies.length === 0) {
          throw new Error('Cookie string is empty after sanitization. Please check cookie format.');
        }
        if (finalCookies.includes('\n') || finalCookies.includes('\r')) {
          throw new Error('Cookie string contains invalid characters (newlines). Please check cookie format.');
        }
        config.headers['Cookie'] = finalCookies;
        console.log('🔗 Using cookie-based authentication for remote upload...');
      } else if (this.login && this.key) {
        config.params.login = this.login;
        config.params.key = this.key;
        console.log('🔗 Using API key authentication for remote upload...');
      } else {
        throw new Error('No authentication method provided (need login+key or cookies)');
      }
      
      console.log('📡 Calling Streamtape remote upload API...');
      const response = await axios.get(`${this.baseUrl}/file/add`, config);
      
      console.log('📥 Remote upload API response status:', response.status);
      console.log('📥 Remote upload API response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.status === 200) {
        const result = response.data.result;
        
        // Extract file ID from response
        let fileId = result.id || result.fileid || result.file_id || result.fid;
        let fileUrl = result.url || result.file_url || result.download_url;
        let embedUrl = result.embed_url || result.embedUrl;
        
        // If fileId not directly available, try to extract from URL
        if (!fileId && fileUrl) {
          const urlMatch = fileUrl.match(/[\/v|e|d]+\/([a-zA-Z0-9]+)/);
          if (urlMatch && urlMatch[1]) {
            fileId = urlMatch[1];
          }
        }
        
        // Construct URLs if not provided
        if (fileId) {
          if (!embedUrl) {
            embedUrl = `https://streamtape.com/e/${fileId}/`;
          }
          if (!fileUrl) {
            fileUrl = `https://streamtape.com/v/${fileId}/`;
          }
          
          console.log('✅ Remote upload successful!');
          console.log('   File ID:', fileId);
          console.log('   Embed URL:', embedUrl);
          console.log('   File URL:', fileUrl);
          
          return {
            success: true,
            fileId: fileId,
            fileUrl: fileUrl,
            embedUrl: embedUrl
          };
        } else {
          console.error('❌ File ID not found in remote upload response:', JSON.stringify(result, null, 2));
          throw new Error(`Remote upload completed but file ID not found in response: ${JSON.stringify(result)}`);
        }
      }
      
      throw new Error(`Remote upload failed. API returned: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (error.response) {
        console.error('❌ Remote upload API error:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`Streamtape remote upload API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Streamtape remote upload error: ${error.message}`);
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileId) {
    try {
      const config = {
        params: { file: fileId },
        headers: {}
      };
      
      // Use cookies or API key (already sanitized)
      if (this.useCookies && this.cookies) {
        // Additional sanitization check before adding to headers
        const finalCookies = this.sanitizeCookies(this.cookies);
        if (!finalCookies || finalCookies.length === 0) {
          throw new Error('Cookie string is empty after sanitization. Please check cookie format.');
        }
        // Validate cookie string doesn't contain invalid characters for HTTP headers
        if (finalCookies.includes('\n') || finalCookies.includes('\r')) {
          throw new Error('Cookie string contains invalid characters (newlines). Please check cookie format.');
        }
        config.headers['Cookie'] = finalCookies;
      } else if (this.login && this.key) {
        config.params.login = this.login;
        config.params.key = this.key;
      } else {
        throw new Error('No authentication method provided');
      }
      
      const response = await axios.get(`${this.baseUrl}/file/info`, config);

      if (response.data && response.data.status === 200) {
        return response.data.result;
      }

      throw new Error('Failed to get file info');
    } catch (error) {
      throw new Error(`Streamtape API error: ${error.message}`);
    }
  }
}

module.exports = { StreamtapeClient };

