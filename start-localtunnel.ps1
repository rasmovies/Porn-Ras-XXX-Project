# LocalTunnel Başlatma Scripti
# Bu script, backend'i LocalTunnel ile expose eder

$BACKEND_PORT = 5000

Write-Host "=== LOCALTUNNEL BASLATILIYOR ===" -ForegroundColor Cyan
Write-Host ""

# LocalTunnel kontrolü
$localtunnelInstalled = Get-Command lt -ErrorAction SilentlyContinue
if (-not $localtunnelInstalled) {
    Write-Host "❌ HATA: LocalTunnel kurulu değil!" -ForegroundColor Red
    Write-Host "`nKurulum:" -ForegroundColor Yellow
    Write-Host "npm install -g localtunnel" -ForegroundColor Cyan
    Write-Host "`nKurulum yapılsın mı? (Y/N)" -ForegroundColor Yellow
    $install = Read-Host
    if ($install -eq "Y" -or $install -eq "y") {
        Write-Host "LocalTunnel kuruluyor..." -ForegroundColor Yellow
        npm install -g localtunnel
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ LocalTunnel kuruldu!" -ForegroundColor Green
        } else {
            Write-Host "❌ LocalTunnel kurulumu başarısız!" -ForegroundColor Red
            exit 1
        }
    } else {
        exit 1
    }
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

# LocalTunnel başlat
Write-Host "`n✅ LocalTunnel başlatılıyor..." -ForegroundColor Green
Write-Host "Backend: http://localhost:$BACKEND_PORT" -ForegroundColor Cyan
Write-Host "`n⚠️ ÖNEMLİ: Bu pencereyi kapatma! LocalTunnel çalışırken açık kalmalı." -ForegroundColor Yellow
Write-Host "Terminal'de görünen URL'yi kopyala (örnek: https://xxxxx.loca.lt)" -ForegroundColor Yellow
Write-Host "Durdurmak için Ctrl+C yapın.`n" -ForegroundColor Yellow
Write-Host "URL aşağıda görünecektir:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# LocalTunnel başlat
lt --port $BACKEND_PORT



