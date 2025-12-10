# Tüm Deployment Scripti
# Bu script LocalTunnel URL'sini alır, Vercel'e ayarlar ve deploy eder

Write-Host "=== TUM DEPLOYMENT SCRIPTI ===" -ForegroundColor Cyan
Write-Host ""

# 1. Backend kontrolü
Write-Host "1. Backend kontrol ediliyor..." -ForegroundColor Yellow
$backend = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($backend) {
    Write-Host "   ✅ Backend çalışıyor (port 5000)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend çalışmıyor! Başlatılıyor..." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; node server.js" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    Write-Host "   ⚠️ Backend başlatıldı. 5 saniye bekleniyor..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# 2. Proton Bridge kontrolü
Write-Host "`n2. Proton Bridge kontrol ediliyor..." -ForegroundColor Yellow
$bridge = Get-Process -Name "bridge" -ErrorAction SilentlyContinue
if ($bridge) {
    Write-Host "   ✅ Proton Bridge çalışıyor" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Proton Bridge çalışmıyor! Lütfen Proton Mail Bridge uygulamasını açın." -ForegroundColor Yellow
}

# 3. LocalTunnel başlat
Write-Host "`n3. LocalTunnel başlatılıyor..." -ForegroundColor Yellow
Write-Host "   ⚠️ Yeni bir pencerede LocalTunnel başlatılacak." -ForegroundColor Yellow
Write-Host "   URL'yi görünce kopyalayın ve 'tunnel-url.txt' dosyasına kaydedin." -ForegroundColor Cyan
Write-Host ""

# LocalTunnel'i başlat
$ltProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '=== LOCALTUNNEL ===' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Backend: http://localhost:5000' -ForegroundColor Green; Write-Host ''; Write-Host 'URL aşağıda görünecektir:' -ForegroundColor Yellow; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; lt --port 5000" -PassThru

Write-Host "   LocalTunnel başlatıldı! URL'yi bekliyorum..." -ForegroundColor Green
Write-Host "   ⚠️ NOT: URL'yi 'tunnel-url.txt' dosyasına kaydetmeniz gerekiyor." -ForegroundColor Yellow
Write-Host ""

# URL'yi bekle
Write-Host "4. URL bekleniyor (30 saniye)..." -ForegroundColor Yellow
$urlFound = $false
$waitTime = 30
$checkInterval = 2
$elapsed = 0

while ($elapsed -lt $waitTime -and -not $urlFound) {
    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
    
    if (Test-Path "tunnel-url.txt") {
        $url = Get-Content "tunnel-url.txt" -Raw
        $url = $url.Trim()
        if ($url -match '^https://[a-z0-9-]+\.loca\.lt$') {
            Write-Host "   ✅ URL bulundu: $url" -ForegroundColor Green
            $urlFound = $true
            break
        }
    }
    
    Write-Host "   ... bekleniyor ($elapsed/$waitTime saniye)" -ForegroundColor Gray
}

if (-not $urlFound) {
    Write-Host "   ❌ URL bulunamadı!" -ForegroundColor Red
    Write-Host "   ⚠️ Manuel olarak URL'yi 'tunnel-url.txt' dosyasına kaydedin." -ForegroundColor Yellow
    Write-Host "   Örnek: https://xxxxx.loca.lt" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   URL'yi girdikten sonra scripti tekrar çalıştırın:" -ForegroundColor Yellow
    Write-Host "   .\deploy-all.ps1" -ForegroundColor Cyan
    exit 1
}

# 5. Vercel environment variable ayarla
Write-Host "`n5. Vercel environment variable ayarlanıyor..." -ForegroundColor Yellow
& .\setup-vercel-env.ps1 -TunnelUrl $url

# 6. Frontend deploy
Write-Host "`n6. Frontend deploy ediliyor..." -ForegroundColor Yellow
cd client
Write-Host "   Vercel'e deploy ediliyor..." -ForegroundColor Cyan
vercel --prod
cd ..

Write-Host ""
Write-Host "=== DEPLOYMENT TAMAMLANDI ===" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Yapılanlar:" -ForegroundColor Green
Write-Host "1. Backend çalışıyor (port 5000)" -ForegroundColor White
Write-Host "2. LocalTunnel çalışıyor ($url)" -ForegroundColor White
Write-Host "3. Vercel environment variable ayarlandı" -ForegroundColor White
Write-Host "4. Frontend deploy edildi" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ ÖNEMLI:" -ForegroundColor Yellow
Write-Host "- LocalTunnel penceresini kapatmayın! Çalışırken açık kalmalı." -ForegroundColor White
Write-Host "- Backend çalışmalı (port 5000)" -ForegroundColor White
Write-Host "- Proton Bridge çalışmalı (SMTP port 1025)" -ForegroundColor White
Write-Host ""



