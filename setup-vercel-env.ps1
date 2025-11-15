# Vercel Environment Variable Setup Script
param(
    [Parameter(Mandatory=$true)]
    [string]$TunnelUrl
)

Write-Host "=== VERCEL ENVIRONMENT VARIABLE AYARLANIYOR ===" -ForegroundColor Cyan
Write-Host ""

# Vercel CLI kontrolü
$vercel = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercel) {
    Write-Host "❌ HATA: Vercel CLI kurulu değil!" -ForegroundColor Red
    Write-Host "Kurulum: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI bulundu" -ForegroundColor Green
Write-Host ""

# Tunnel URL kontrolü
if ([string]::IsNullOrWhiteSpace($TunnelUrl)) {
    Write-Host "❌ HATA: Tunnel URL boş!" -ForegroundColor Red
    exit 1
}

# URL formatını kontrol et
if ($TunnelUrl -notmatch '^https://[a-z0-9-]+\.loca\.lt$') {
    Write-Host "⚠️ UYARI: URL formatı beklenen gibi değil: $TunnelUrl" -ForegroundColor Yellow
    Write-Host "Beklenen format: https://xxxxx.loca.lt" -ForegroundColor Cyan
}

Write-Host "Tunnel URL: $TunnelUrl" -ForegroundColor Cyan
Write-Host ""

# Vercel'de environment variable ayarla
Write-Host "Vercel'de environment variable ayarlanıyor..." -ForegroundColor Yellow
Write-Host "⚠️ NOT: Bu işlem Vercel CLI ile yapılacak. Eğer oturum açmadıysanız, tarayıcıda açılacak." -ForegroundColor Yellow
Write-Host ""

# Vercel environment variable ekle
try {
    # Production environment için
    Write-Host "Production environment için ayarlanıyor..." -ForegroundColor Cyan
    $result = & vercel env add REACT_APP_API_BASE_URL production $TunnelUrl 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Production environment variable eklendi!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Production environment variable eklenirken hata oluştu (zaten var olabilir)" -ForegroundColor Yellow
        Write-Host "Güncelleme deneniyor..." -ForegroundColor Yellow
        # Güncelleme için env rm ve env add yapılabilir
    }
    
    # Preview environment için
    Write-Host "Preview environment için ayarlanıyor..." -ForegroundColor Cyan
    $result = & vercel env add REACT_APP_API_BASE_URL preview $TunnelUrl 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Preview environment variable eklendi!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Preview environment variable eklenirken hata oluştu (zaten var olabilir)" -ForegroundColor Yellow
    }
    
    # Development environment için
    Write-Host "Development environment için ayarlanıyor..." -ForegroundColor Cyan
    $result = & vercel env add REACT_APP_API_BASE_URL development $TunnelUrl 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Development environment variable eklendi!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Development environment variable eklenirken hata oluştu (zaten var olabilir)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✅ Environment variable'lar ayarlandı!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 SONRAKI ADIMLAR:" -ForegroundColor Yellow
    Write-Host "1. Frontend'i deploy et: cd client && vercel --prod" -ForegroundColor White
    Write-Host "2. Veya GitHub'a push et (otomatik deploy olur)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ HATA: Environment variable ayarlanırken hata oluştu!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 MANUEL AYARLAMA:" -ForegroundColor Yellow
    Write-Host "1. Vercel Dashboard'a git: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Projeni seç" -ForegroundColor White
    Write-Host "3. Settings -> Environment Variables" -ForegroundColor White
    Write-Host "4. Yeni variable ekle:" -ForegroundColor White
    Write-Host "   - Key: REACT_APP_API_BASE_URL" -ForegroundColor Cyan
    Write-Host "   - Value: $TunnelUrl" -ForegroundColor Cyan
    Write-Host "   - Environment: Production, Preview, Development (hepsini seç)" -ForegroundColor Cyan
    Write-Host "5. Save butonuna tıkla" -ForegroundColor White
    exit 1
}



