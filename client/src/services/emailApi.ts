// React build-time environment variable
const reactBase = process.env.REACT_APP_API_BASE_URL;

// Production'da backend URL'ini belirleme
// 1. REACT_APP_API_BASE_URL environment variable (Vercel'de ayarlanmalı)
// 2. API subdomain fallback (api.pornras.com)
// 3. Local development fallback (localhost:5000)
const getApiBaseUrl = (): string => {
  // Build-time environment variable (öncelikli)
  if (reactBase) {
    return reactBase;
  }

  // Production environment'da api.pornras.com kullan
  if (typeof window !== 'undefined' && window.location.hostname.includes('pornras.com')) {
    // Backend VPS'te api.pornras.com'da çalışıyor
    const apiUrl = 'https://api.pornras.com';
    console.log('🔍 Production mode - using API subdomain:', apiUrl);
    return apiUrl;
  }

  // Local development fallback
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Production'da API_BASE_URL yoksa uyarı ver ve fallback kullan
if (typeof window !== 'undefined' && window.location.hostname.includes('pornras.com')) {
  if (!API_BASE_URL) {
    console.error('⚠️ REACT_APP_API_BASE_URL environment variable is not set in Vercel!');
    console.error('Please set REACT_APP_API_BASE_URL in Vercel Dashboard -> Settings -> Environment Variables');
  } else {
    console.log('✅ API_BASE_URL:', API_BASE_URL);
  }
}

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // API_BASE_URL değerini her zaman logla
  console.log('🔍 buildUrl called:', { 
    path, 
    API_BASE_URL: API_BASE_URL || 'YOK!', 
    reactBase: process.env.REACT_APP_API_BASE_URL || 'YOK!',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A' 
  });
  
  // Production'da API_BASE_URL yoksa fallback kullan
  if (!API_BASE_URL) {
    const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('pornras.com');
    if (isProduction) {
      // Production'da fallback URL kullan
      const fallbackUrl = 'https://api.pornras.com';
      console.warn('⚠️ buildUrl: API_BASE_URL bulunamadı, fallback kullanılıyor:', fallbackUrl);
      const fullUrl = `${fallbackUrl.replace(/\/$/, '')}${normalizedPath}`;
      console.log('✅ buildUrl result (fallback):', fullUrl);
      return fullUrl;
    }
    // Local development'da localhost:5000 kullan
    console.log('⚠️ API_BASE_URL yok, local development için localhost kullanılıyor');
    return normalizedPath;
  }
  
  const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}${normalizedPath}`;
  console.log('✅ buildUrl result:', fullUrl);
  return fullUrl;
};

async function postJson<TInput extends object, TResponse>(path: string, body: TInput): Promise<TResponse> {
  let url = '';
  
  try {
    // Production'da doğrudan API URL'i kullan
    const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('pornras.com');
    
    // Normal API_BASE_URL kullan (api.pornras.com)
    if (!API_BASE_URL) {
      // API_BASE_URL kontrolü - production'da fallback kullan
      if (isProduction) {
        // Production'da api.pornras.com kullan
        const fallbackUrl = 'https://api.pornras.com';
        console.warn('⚠️ API_BASE_URL bulunamadı, fallback kullanılıyor:', fallbackUrl);
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        url = `${fallbackUrl.replace(/\/$/, '')}${normalizedPath}`;
      } else {
        const errorMsg = 'Backend URL is not configured. Please set REACT_APP_API_BASE_URL in Vercel Dashboard.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }
    } else {
      url = buildUrl(path);
    }
    console.log('📤 POST request:', { url, path, body });
    
    // Fetch with timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      console.log('🔍 Fetch options:', {
        url,
        method: 'POST',
        mode: 'cors',
        origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        headers: Object.keys(headers),
        hasBody: !!body,
      });
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors', // CORS için explicit mode
        cache: 'no-cache', // Cache'i devre dışı bırak
        credentials: 'omit', // Credentials gönderme (CORS için)
        redirect: 'follow', // Redirect'leri takip et
        referrerPolicy: 'no-referrer-when-downgrade', // Referrer policy
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📥 Response received:', { status: response.status, statusText: response.statusText, url });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = (payload && payload.message) || `API error (${response.status})`;
        console.error('❌ API error:', { status: response.status, message, payload });
        throw new Error(message);
      }

      const result = await response.json();
      console.log('✅ Response OK:', result);
      return result as TResponse;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Network/CORS hatası kontrolü
      if (fetchError.name === 'AbortError') {
        const timeoutError = new Error('Request timeout. Backend may be unreachable.');
        console.error('❌ Request timeout:', timeoutError);
        console.error('❌ Request URL:', url);
        throw timeoutError;
      }
      
      if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
        const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('pornras.com');
        const errorMessage = isProduction
          ? `Network error: Cannot connect to backend at ${url}. Please check:
1. REACT_APP_API_BASE_URL is set correctly in Vercel Dashboard
2. Backend is deployed and accessible
3. CORS is configured correctly on backend`
          : `Network error: Cannot connect to backend at ${url}. Make sure backend is running on localhost:5000.`;
        
        const networkError = new Error(errorMessage);
        console.error('❌ Network error:', networkError);
        console.error('❌ Original error:', fetchError);
        console.error('❌ API_BASE_URL:', API_BASE_URL || 'YOK!');
        console.error('❌ Request URL:', url || 'YOK!');
        console.error('❌ Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
        throw networkError;
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ postJson error:', { 
      path, 
      url: url || 'YOK!',
      API_BASE_URL: API_BASE_URL || 'YOK!',
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined 
    });
    throw error;
  }
}

export interface VerificationEmailPayload {
  email: string;
  username: string;
  verifyUrl?: string;
  verificationCode?: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export interface InviteEmailPayload {
  inviterName: string;
  inviteeEmail: string;
  inviteUrl: string;
}

export interface MarketingEmailPayload {
  subject: string;
  headline: string;
  message: string;
  recipients: string[];
  ctaUrl?: string;
  ctaLabel?: string;
  unsubscribeUrl?: string;
}

export interface BlueskyShareVideoPayload {
  title: string;
  description?: string;
  thumbnail?: string;
  slug: string;
}

export interface BlueskyPostPayload {
  text: string;
  imageUrl?: string;
  linkUrl?: string;
}

export interface WelcomeEmailPayload {
  email: string;
  name: string;
}

export const emailApi = {
  sendVerificationEmail: (payload: VerificationEmailPayload) =>
    postJson<VerificationEmailPayload, { success: boolean }>('/api/email/verification', payload),
  generateVerificationCode: (payload: { email: string; username: string }) =>
    postJson<{ email: string; username: string }, { success: boolean; message: string }>('/api/auth/generate-code', payload),
  verifyCode: (payload: VerifyCodePayload) =>
    postJson<VerifyCodePayload, { success: boolean; message: string; username?: string }>('/api/auth/verify-code', payload),
  sendInviteEmail: (payload: InviteEmailPayload) =>
    postJson<InviteEmailPayload, { success: boolean }>('/api/email/invite', payload),
  sendMarketingEmail: (payload: MarketingEmailPayload) =>
    postJson<MarketingEmailPayload, { success: boolean }>('/api/email/marketing', payload),
  sendWelcomeEmail: (payload: WelcomeEmailPayload) =>
    postJson<WelcomeEmailPayload, { success: boolean }>('/api/email/welcome', payload),
};

export const blueskyApi = {
  shareVideo: (payload: BlueskyShareVideoPayload) =>
    postJson<BlueskyShareVideoPayload, { success: boolean; data?: any }>('/api/bluesky/share-video', payload),
  post: (payload: BlueskyPostPayload) =>
    postJson<BlueskyPostPayload, { success: boolean; data?: any }>('/api/bluesky/post', payload),
};


