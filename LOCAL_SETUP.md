# 🖥️ Local Development Setup

## Environment Variables

Local development için `client/.env.local` dosyası oluşturun:

```bash
cd client
cat > .env.local << 'EOF'
REACT_APP_SUPABASE_URL=https://xgyjhofakpatrqgvleze.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ
REACT_APP_API_BASE_URL=http://localhost:5000
EOF
```

## Supabase API Key Kontrolü

Eğer "Invalid API key" hatası alıyorsanız:

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard
   - Projenizi seçin: `xgyjhofakpatrqgvleze`

2. **Settings → API:**
   - "Project API keys" bölümünde `anon` `public` key'i kontrol edin
   - Key'in doğru olduğundan emin olun

3. **Key'i güncelleyin:**
   - Eğer key değiştiyse, `.env.local` dosyasını güncelleyin
   - Development server'ı yeniden başlatın

## Development Server Başlatma

```bash
# Client (Frontend)
cd client
npm install --legacy-peer-deps
npm start

# Server (Backend - eğer gerekirse)
cd ..
npm install
npm start
```

## Sorun Giderme

### 401 Unauthorized Hatası
- Supabase API key'inin doğru olduğundan emin olun
- `.env.local` dosyasının `client/` dizininde olduğundan emin olun
- Development server'ı yeniden başlatın (Ctrl+C, sonra `npm start`)

### API Key Expired
- Supabase Dashboard'dan yeni key alın
- `.env.local` dosyasını güncelleyin
- Server'ı yeniden başlatın

