# Ngrok Başlatma Scripti
# Bu script, backend'i Ngrok ile expose eder

$BACKEND_PORT = 5000
$NGROK_PATH = "C:\Users\User\AppData\Local\Programs\ngrok.exe"

Write-Host "=== NGROK BASLATILIYOR ===" -ForegroundColor Cyan
Write-Host ""

# Ngrok kontrolü
if (-not (Test-Path $NGROK_PATH)) {
    Write-Host "❌ HATA: Ngrok bulunamadı!" -ForegroundColor Red
    Write-Host "`nKurulum:" -ForegroundColor Yellow
    Write-Host "1. https://ngrok.com/download -> Windows indir" -ForegroundColor White
    Write-Host "2. Zip'i aç ve ngrok.exe'yi C:\Users\User\AppData\Local\Programs\ klasörüne kopyala" -ForegroundColor White
    Write-Host "3. Veya: winget install ngrok" -ForegroundColor White
    Write-Host "`nAlternatif: LocalTunnel kullan (daha kolay)" -ForegroundColor Green
    Write-Host "npm install -g localtunnel" -ForegroundColor Cyan
    Write-Host "lt --port 5000" -ForegroundColor Cyan
    exit 1
}

# Backend kontrolü
Write-Host "Backend kontrol ediliyor..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port $BACKEND_PORT -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $backendRunning) {
    Write-Host "❌ HATA: Backend port $BACKEND_PORT'de çalışmıyor!" -ForegroundColor Red
    Write-Host "Backend'i başlatmak için: cd server && node server.js" -ForegroundColor Yellow
    Write-Host "`nDevam etmek istiyor musunuz? (Y/N)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "✅ Backend çalışıyor (port $BACKEND_PORT)" -ForegroundColor Green
}

# Proton Bridge kontrolü
Write-Host "`nProton Bridge kontrol ediliyor..." -ForegroundColor Yellow
$protonBridge = Get-Process -Name "bridge" -ErrorAction SilentlyContinue
if ($protonBridge) {
    Write-Host "✅ Proton Bridge çalışıyor" -ForegroundColor Green
} else {
    Write-Host "⚠️ UYARI: Proton Bridge çalışmıyor!" -ForegroundColor Yellow
    Write-Host "Proton Bridge'i başlatmak için: Proton Mail Bridge uygulamasını aç" -ForegroundColor White
}

# Ngrok başlat
Write-Host "`n✅ Ngrok başlatılıyor..." -ForegroundColor Green
Write-Host "Backend: http://localhost:$BACKEND_PORT" -ForegroundColor Cyan
Write-Host "`n⚠️ ÖNEMLİ: Bu pencereyi kapatma! Ngrok çalışırken açık kalmalı." -ForegroundColor Yellow
Write-Host "Terminal'de görünen URL'yi kopyala (örnek: https://xxxxx.ngrok-free.app)" -ForegroundColor Yellow
Write-Host "Durdurmak için Ctrl+C yapın.`n" -ForegroundColor Yellow
Write-Host "URL aşağıda görünecektir:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ngrok başlat
& $NGROK_PATH http $BACKEND_PORT



