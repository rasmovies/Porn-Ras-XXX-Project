// React build-time environment variable
const reactBase = process.env.REACT_APP_API_BASE_URL;

// Production'da backend URL'si Vercel'de REACT_APP_API_BASE_URL environment variable olarak ayarlanmalı
// LocalTunnel URL örneği: https://hot-showers-notice.loca.lt
const hostedFallback =
  typeof window !== 'undefined' && window.location.hostname.includes('pornras.com')
    ? reactBase || undefined // Vercel'de environment variable olarak backend URL'si ayarlanmalı
    : undefined;

const localFallback =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : undefined;

// API_BASE_URL belirlenmesi: önce reactBase (Vercel env var), sonra hostedFallback, sonra localFallback
// Eğer hiçbiri yoksa, production'da hata fırlat
const API_BASE_URL = reactBase || hostedFallback || localFallback || '';

// Production'da API_BASE_URL yoksa uyarı ver
if (typeof window !== 'undefined' && window.location.hostname.includes('pornras.com') && !API_BASE_URL) {
  console.error('⚠️ REACT_APP_API_BASE_URL environment variable is not set in Vercel!');
  console.error('Please set REACT_APP_API_BASE_URL in Vercel Dashboard -> Settings -> Environment Variables');
}

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // API_BASE_URL değerini her zaman logla
  console.log('🔍 buildUrl called:', { 
    path, 
    API_BASE_URL: API_BASE_URL || 'https://porn-ras-xxx-project-igoxot2om-ras-projects-6ebe5a01.vercel.app ', 
    reactBase: process.env.REACT_APP_API_BASE_URL || 'https://porn-ras-xxx-project-igoxot2om-ras-projects-6ebe5a01.vercel.app ',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A' 
  });
  
  // Production'da API_BASE_URL yoksa hata fırlat
  if (!API_BASE_URL) {
    const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('pornras.com');
    if (isProduction) {
      const errorMsg = 'Backend URL is not configured. Please set REACT_APP_API_BASE_URL in Vercel Dashboard -> Settings -> Environment Variables';
      console.error('❌', errorMsg);
      console.error('❌ API_BASE_URL:', API_BASE_URL);
      console.error('❌ REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
      throw new Error(errorMsg);
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
  try {
    const url = buildUrl(path);
    console.log('📤 POST request:', { url, path, body });
    
    const response = await fetch ('https://vercel.com/ras-projects-6ebe5a01/porn-ras-xxx-project/9eshvpyrSuVE8fCcKe7ipBZrxRtd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

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
  } catch (error) {
    console.error('❌ postJson error:', { path, error: error instanceof Error ? error.message : error });
    throw error;
  }
}

export interface VerificationEmailPayload {
  email: string;
  username: string;
  verifyUrl: string;
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

export const emailApi = {
  sendVerificationEmail: (payload: VerificationEmailPayload) =>
    postJson<VerificationEmailPayload, { success: boolean }>('/api/email/verification', payload),
  sendInviteEmail: (payload: InviteEmailPayload) =>
    postJson<InviteEmailPayload, { success: boolean }>('/api/email/invite', payload),
  sendMarketingEmail: (payload: MarketingEmailPayload) =>
    postJson<MarketingEmailPayload, { success: boolean }>('/api/email/marketing', payload),
};

export const blueskyApi = {
  shareVideo: (payload: BlueskyShareVideoPayload) =>
    postJson<BlueskyShareVideoPayload, { success: boolean; data?: any }>('/api/bluesky/share-video', payload),
  post: (payload: BlueskyPostPayload) =>
    postJson<BlueskyPostPayload, { success: boolean; data?: any }>('/api/bluesky/post', payload),
};


