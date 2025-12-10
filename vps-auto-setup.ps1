# VPS Email Setup - Otomatik
$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS Email Otomatik Kurulum Baslatiyor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Posh-SSH modülünü kontrol et
Import-Module Posh-SSH -Force

# VPS'e bağlan
Write-Host "[1/8] VPS'e baglaniyor..." -ForegroundColor Cyan
$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey
if (-not $Session) {
    Write-Host "HATA: VPS'e baglanilamadi!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: VPS'e baglanildi (Session: $($Session.SessionId))" -ForegroundColor Green

# Helper fonksiyon
function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

# Proton Mail Bridge durumu
Write-Host ""
Write-Host "[2/8] Proton Mail Bridge kontrol ediliyor..." -ForegroundColor Cyan
$BridgeStatus = Invoke-VpsCmd "systemctl is-active protonmail-bridge"
if ($BridgeStatus.Output.Trim() -eq "active") {
    Write-Host "OK: Proton Mail Bridge calisiyor" -ForegroundColor Green
} else {
    Write-Host "Bridge baslatiliyor..." -ForegroundColor Yellow
    Invoke-VpsCmd "sudo systemctl start protonmail-bridge" | Out-Null
    Start-Sleep -Seconds 3
    $BridgeStatus = Invoke-VpsCmd "systemctl is-active protonmail-bridge"
    if ($BridgeStatus.Output.Trim() -eq "active") {
        Write-Host "OK: Bridge baslatildi" -ForegroundColor Green
    } else {
        Write-Host "HATA: Bridge baslatilamadi!" -ForegroundColor Red
        Write-Host "Bridge loglari:" -ForegroundColor Yellow
        $ErrorLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 10 --no-pager"
        Write-Host $ErrorLogs.Output -ForegroundColor Red
        Remove-SSHSession -SessionId $Session.SessionId | Out-Null
        exit 1
    }
}

# SMTP bilgilerini al
Write-Host ""
Write-Host "[3/8] SMTP bilgileri aliniyor..." -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 100 --no-pager"
$SMTPInfo = $BridgeLogs.Output | Select-String -Pattern "SMTP.*listening" | Select-Object -First 1

$SMTPHost = "127.0.0.1"
$SMTPPort = "1025"

if ($SMTPInfo -match "listening on (\d+\.\d+\.\d+\.\d+):(\d+)") {
    $SMTPHost = $Matches[1]
    $SMTPPort = $Matches[2]
} elseif ($SMTPInfo -match "listening on (\d+)") {
    $SMTPPort = $Matches[1]
}

Write-Host "SMTP Host: $SMTPHost" -ForegroundColor Gray
Write-Host "SMTP Port: $SMTPPort" -ForegroundColor Gray

# Username al
$ConfigCmd = "test -f ~/.config/protonmail/bridge/prefs.json && cat ~/.config/protonmail/bridge/prefs.json | grep -i User | head -1 || echo ''"
$ConfigResult = Invoke-VpsCmd $ConfigCmd
$BridgeUsername = ""
if ($ConfigResult.Output -match 'User["\s]*:\s*["]([^"]+)["]') {
    $BridgeUsername = $Matches[1]
    Write-Host "Username: $BridgeUsername" -ForegroundColor Gray
}

# Backend dizini kontrol
Write-Host ""
Write-Host "[4/8] Backend dizini kontrol ediliyor..." -ForegroundColor Cyan
$DirCheck = Invoke-VpsCmd "test -d $BackendPath && echo 'exists' || echo 'not found'"
if ($DirCheck.Output -notmatch "exists") {
    Write-Host "HATA: Backend dizini bulunamadi: $BackendPath" -ForegroundColor Red
    Remove-SSHSession -SessionId $Session.SessionId | Out-Null
    exit 1
}
Write-Host "OK: Backend dizini mevcut" -ForegroundColor Green

# .env dosyası oluştur/güncelle
Write-Host ""
Write-Host "[5/8] .env dosyasi olusturuluyor..." -ForegroundColor Cyan

$EnvContent = @"
PORT=5000
NODE_ENV=production
PROTON_SMTP_HOST=$SMTPHost
PROTON_SMTP_PORT=$SMTPPort
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=$BridgeUsername
PROTON_SMTP_PASSWORD=
PROTON_FROM_EMAIL=$BridgeUsername
PROTON_FROM_NAME=PORNRAS
"@

$EnvBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($EnvContent))
$CreateEnvCmd = @"
cd $BackendPath
echo '$EnvBase64' | base64 -d > .env
chmod 600 .env
"@

Invoke-VpsCmd $CreateEnvCmd | Out-Null

# SMTP bilgilerini güncelle
$UpdateCmd = @"
cd $BackendPath
sed -i 's|^PROTON_SMTP_HOST=.*|PROTON_SMTP_HOST=$SMTPHost|' .env
sed -i 's|^PROTON_SMTP_PORT=.*|PROTON_SMTP_PORT=$SMTPPort|' .env
"@
Invoke-VpsCmd $UpdateCmd | Out-Null

if ($BridgeUsername) {
    $UpdateUserCmd = @"
cd $BackendPath
sed -i 's|^PROTON_SMTP_USERNAME=.*|PROTON_SMTP_USERNAME=$BridgeUsername|' .env
sed -i 's|^PROTON_FROM_EMAIL=.*|PROTON_FROM_EMAIL=$BridgeUsername|' .env
"@
    Invoke-VpsCmd $UpdateUserCmd | Out-Null
}

Write-Host "OK: .env dosyasi olusturuldu/guncellendi" -ForegroundColor Green

# .env içeriğini göster
Write-Host ""
Write-Host "[6/8] .env icerigi:" -ForegroundColor Cyan
$EnvShow = Invoke-VpsCmd "cd $BackendPath && cat .env"
Write-Host $EnvShow.Output -ForegroundColor Gray

# Backend'i yeniden başlat
Write-Host ""
Write-Host "[7/8] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
$RestartCmd = "cd $BackendPath && pm2 restart adulttube-backend 2>&1 || pm2 start server.js --name adulttube-backend 2>&1"
$RestartResult = Invoke-VpsCmd $RestartCmd
Write-Host $RestartResult.Output -ForegroundColor Gray

Start-Sleep -Seconds 3

# Logları kontrol
Write-Host ""
Write-Host "[8/8] Backend loglari kontrol ediliyor..." -ForegroundColor Cyan
$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 30 --nostream 2>&1"
Write-Host $Logs.Output -ForegroundColor Gray

# Bağlantıyı kapat
Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "KURULUM TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NOT: Bridge password henuz girilmedi." -ForegroundColor Yellow
Write-Host "Bridge password'u .env dosyasina manuel eklemek icin VPS'te:" -ForegroundColor Yellow
Write-Host "  cd $BackendPath" -ForegroundColor Gray
Write-Host "  nano .env" -ForegroundColor Gray
Write-Host "  PROTON_SMTP_PASSWORD=... satirini duzenleyin" -ForegroundColor Gray
Write-Host ""

