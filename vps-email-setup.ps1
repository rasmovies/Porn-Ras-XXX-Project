# VPS Email Setup Script - PowerShell
# Bu script Proton Mail Bridge'i backend'e bağlar
# Kullanım: .\vps-email-setup.ps1 -VpsIp "your-vps-ip" -VpsUser "root"

param(
    [Parameter(Mandatory=$false)]
    [string]$VpsIp = "",
    
    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$VpsPassword = "",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendPath = "/var/www/adulttube-backend/server"
)

# PowerShell versiyonu kontrol et
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "❌ PowerShell 5.0 veya üzeri gerekli!" -ForegroundColor Red
    exit 1
}

# SSH modülünü kontrol et (Posh-SSH)
Write-Host "🔍 SSH modülü kontrol ediliyor..." -ForegroundColor Cyan
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "⚠️  Posh-SSH modülü bulunamadı, yükleniyor..." -ForegroundColor Yellow
    try {
        Install-Module -Name Posh-SSH -Scope CurrentUser -Force -AllowClobber
        Write-Host "✅ Posh-SSH modülü yüklendi" -ForegroundColor Green
    } catch {
        Write-Host "❌ Posh-SSH modülü yüklenemedi: $_" -ForegroundColor Red
        Write-Host "💡 Manuel yüklemek için: Install-Module -Name Posh-SSH -Scope CurrentUser" -ForegroundColor Yellow
        exit 1
    }
}

Import-Module Posh-SSH -Force

# VPS bilgilerini al
if ([string]::IsNullOrEmpty($VpsIp)) {
    $VpsIp = Read-Host "VPS IP adresi"
}

if ([string]::IsNullOrEmpty($VpsPassword)) {
    $SecurePassword = Read-Host "VPS şifresi" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $VpsPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# VPS'e bağlan
Write-Host ""
Write-Host "🔌 VPS'e bağlanılıyor: $VpsUser@$VpsIp" -ForegroundColor Cyan

# SSH bağlantı testi
Write-Host "   SSH bağlantısı test ediliyor..." -ForegroundColor Gray
$TcpTest = Test-NetConnection -ComputerName $VpsIp -Port 22 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if (-not $TcpTest.TcpTestSucceeded) {
    Write-Host "❌ VPS'e erişilemiyor! Port 22 (SSH) açık değil veya IP yanlış." -ForegroundColor Red
    Write-Host "   Kontrol edin:" -ForegroundColor Yellow
    Write-Host "   1. VPS IP adresi doğru mu? ($VpsIp)" -ForegroundColor Yellow
    Write-Host "   2. VPS çalışıyor mu?" -ForegroundColor Yellow
    Write-Host "   3. SSH servisi VPS'te aktif mi? (sudo systemctl status sshd)" -ForegroundColor Yellow
    Write-Host "   4. Firewall SSH'ı engelliyor mu?" -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✅ Port 22 açık" -ForegroundColor Green

try {
    $SecurePasswordObj = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
    $Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePasswordObj)
    
    Write-Host "   Kimlik doğrulama deneniyor..." -ForegroundColor Gray
    
    # Önce AcceptKey olmadan dene
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ErrorAction Stop
    
    if ($Session) {
        Write-Host "✅ VPS'e bağlanıldı (Session ID: $($Session.SessionId))" -ForegroundColor Green
    } else {
        throw "Bağlantı oluşturulamadı"
    }
} catch {
    $ErrorMessage = $_.Exception.Message
    Write-Host "❌ VPS'e bağlanılamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Hata Detayları:" -ForegroundColor Yellow
    Write-Host "   Mesaj: $ErrorMessage" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Olası Çözümler:" -ForegroundColor Yellow
    Write-Host "   1. VPS IP adresini kontrol edin: $VpsIp" -ForegroundColor Gray
    Write-Host "   2. Kullanıcı adını kontrol edin: $VpsUser" -ForegroundColor Gray
    Write-Host "   3. Şifrenin doğru olduğundan emin olun" -ForegroundColor Gray
    Write-Host "   4. VPS'te SSH key authentication gerekli olabilir (password yerine)" -ForegroundColor Gray
    Write-Host "   5. SSH config dosyasını kontrol edin: ~/.ssh/config" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternatif: SSH key kullanıyorsanız, manuel bağlanın:" -ForegroundColor Cyan
    Write-Host "   ssh $VpsUser@$VpsIp" -ForegroundColor Gray
    exit 1
}

# Komut çalıştırma helper fonksiyonu
function Invoke-VpsCommand {
    param([string]$Command)
    
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Command
    if ($Result.ExitStatus -ne 0) {
        Write-Host "⚠️  Komut hatası: $Command" -ForegroundColor Yellow
        Write-Host "   Hata: $($Result.Error)" -ForegroundColor Yellow
    }
    return $Result
}

# 1. Proton Mail Bridge durumunu kontrol et
Write-Host ""
Write-Host "📧 1. Proton Mail Bridge durumu kontrol ediliyor..." -ForegroundColor Cyan
$BridgeStatus = Invoke-VpsCommand "systemctl is-active proton-bridge"
if ($BridgeStatus.Output -eq "active") {
    Write-Host "✅ Proton Mail Bridge çalışıyor" -ForegroundColor Green
} else {
    Write-Host "⚠️  Proton Mail Bridge çalışmıyor, başlatılıyor..." -ForegroundColor Yellow
    Invoke-VpsCommand "sudo systemctl start proton-bridge"
    Start-Sleep -Seconds 3
    $BridgeStatus = Invoke-VpsCommand "systemctl is-active proton-bridge"
    if ($BridgeStatus.Output -eq "active") {
        Write-Host "✅ Proton Mail Bridge başlatıldı" -ForegroundColor Green
    } else {
        Write-Host "❌ Proton Mail Bridge başlatılamadı!" -ForegroundColor Red
        Remove-SSHSession -SessionId $Session.SessionId | Out-Null
        exit 1
    }
}

# 2. Bridge SMTP bilgilerini al
Write-Host ""
Write-Host "📋 2. Bridge SMTP bilgileri alınıyor..." -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCommand "sudo journalctl -u proton-bridge -n 100 --no-pager"

$SMTPInfo = $BridgeLogs.Output | Select-String -Pattern "SMTP.*?listening on" | Select-Object -First 1
$SMTPHost = "127.0.0.1"
$SMTPPort = "1025"

if ($SMTPInfo) {
    if ($SMTPInfo -match "listening on (\d+\.\d+\.\d+\.\d+):(\d+)") {
        $SMTPHost = $Matches[1]
        $SMTPPort = $Matches[2]
    } elseif ($SMTPInfo -match "listening on (\d+)") {
        $SMTPPort = $Matches[1]
    }
}

Write-Host "   SMTP Host: $SMTPHost" -ForegroundColor Gray
Write-Host "   SMTP Port: $SMTPPort" -ForegroundColor Gray

# 3. Bridge config dosyasından username al
Write-Host "   Bridge config dosyası kontrol ediliyor..." -ForegroundColor Gray
$ConfigCheck = Invoke-VpsCommand "test -f ~/.config/protonmail/bridge/prefs.json && cat ~/.config/protonmail/bridge/prefs.json | grep -i 'User' | head -1 || echo ''"
$BridgeUsername = ""

$MatchResult = [regex]::Match($ConfigCheck.Output, 'User["\s]*:\s*["]([^"]+)["]')
if ($MatchResult.Success) {
    $BridgeUsername = $MatchResult.Groups[1].Value
    Write-Host "   Username: $BridgeUsername" -ForegroundColor Gray
}

# 4. Backend dizinine git ve .env dosyasını kontrol et
Write-Host ""
Write-Host "📁 3. Backend dizini kontrol ediliyor: $BackendPath" -ForegroundColor Cyan
$DirCheck = Invoke-VpsCommand "test -d $BackendPath && echo 'exists' || echo 'not found'"
if ($DirCheck.Output -notmatch "exists") {
    Write-Host "❌ Backend dizini bulunamadı: $BackendPath" -ForegroundColor Red
    Remove-SSHSession -SessionId $Session.SessionId | Out-Null
    exit 1
}

Write-Host "✅ Backend dizini mevcut" -ForegroundColor Green

# 5. .env dosyasını kontrol et veya oluştur
Write-Host ""
Write-Host "⚙️  4. .env dosyası kontrol ediliyor..." -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCommand "cd $BackendPath && test -f .env && echo 'exists' || echo 'not found'"

if ($EnvCheck.Output -notmatch "exists") {
    Write-Host "   .env dosyası bulunamadı, oluşturuluyor..." -ForegroundColor Yellow
    
    # .env içeriği hazırla
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
    
    # .env dosyasını oluştur
    $EnvContent | Out-File -FilePath ".env.temp" -Encoding utf8 -NoNewline
    $EnvContentBytes = [System.IO.File]::ReadAllBytes("$PWD\.env.temp")
    
    # Dosyayı VPS'e yükle (base64 encode ile)
    $EnvBase64 = [Convert]::ToBase64String($EnvContentBytes)
    $CreateEnvCmd = @"
cd $BackendPath
echo '$EnvBase64' | base64 -d > .env
chmod 600 .env
"@
    
    Invoke-VpsCommand $CreateEnvCmd
    Remove-Item ".env.temp" -ErrorAction SilentlyContinue
    Write-Host "✅ .env dosyası oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "✅ .env dosyası mevcut" -ForegroundColor Green
}

# 6. .env dosyasını güncelle
Write-Host ""
Write-Host "📝 5. .env dosyası güncelleniyor..." -ForegroundColor Cyan

$UpdateEnvCmd = @"
cd $BackendPath
sed -i 's|^PROTON_SMTP_HOST=.*|PROTON_SMTP_HOST=$SMTPHost|' .env
sed -i 's|^PROTON_SMTP_PORT=.*|PROTON_SMTP_PORT=$SMTPPort|' .env
"@

Invoke-VpsCommand $UpdateEnvCmd

if (-not [string]::IsNullOrEmpty($BridgeUsername)) {
    $UpdateUserCmd = @"
cd $BackendPath
sed -i 's|^PROTON_SMTP_USERNAME=.*|PROTON_SMTP_USERNAME=$BridgeUsername|' .env
sed -i 's|^PROTON_FROM_EMAIL=.*|PROTON_FROM_EMAIL=$BridgeUsername|' .env
"@
    Invoke-VpsCommand $UpdateUserCmd
}

Write-Host "✅ .env dosyası güncellendi" -ForegroundColor Green

# 7. Bridge password sor
Write-Host ""
Write-Host "🔐 6. Bridge Password" -ForegroundColor Cyan
Write-Host "   Bridge password'ü Bridge GUI'den veya config dosyasından alabilirsiniz." -ForegroundColor Gray
$WantPassword = Read-Host "Bridge password'ü şimdi girmek ister misiniz? (y/n)"

if ($WantPassword -eq "y" -or $WantPassword -eq "Y") {
    $SecureBridgePassword = Read-Host "Bridge Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureBridgePassword)
    $BridgePassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Password'ü escape et
    $BridgePasswordEscaped = $BridgePassword -replace "'", "'\''"
    
    $UpdatePasswordCmd = @"
cd $BackendPath
sed -i 's|^PROTON_SMTP_PASSWORD=.*|PROTON_SMTP_PASSWORD=$BridgePasswordEscaped|' .env
"@
    
    Invoke-VpsCommand $UpdatePasswordCmd
    Write-Host "✅ Password güncellendi" -ForegroundColor Green
}

# 8. .env dosyasını göster
Write-Host ""
Write-Host "📄 7. Güncel .env içeriği:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$EnvContent = Invoke-VpsCommand "cd $BackendPath && cat .env"
Write-Host $EnvContent.Output
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# 9. Backend'i yeniden başlat
Write-Host ""
Write-Host "🔄 8. Backend yeniden başlatılıyor..." -ForegroundColor Cyan
$RestartResult = Invoke-VpsCommand "cd $BackendPath && pm2 restart adulttube-backend 2>&1 || pm2 start server.js --name adulttube-backend 2>&1"

if ($RestartResult.ExitStatus -eq 0) {
    Write-Host "✅ Backend yeniden başlatıldı" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend başlatma uyarısı: $($RestartResult.Output)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# 10. Logları kontrol et
Write-Host ""
Write-Host "📊 9. Backend logları (son 20 satır):" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$Logs = Invoke-VpsCommand "pm2 logs adulttube-backend --lines 20 --nostream 2>&1"
Write-Host $Logs.Output
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Bağlantıyı kapat
Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "✅ Setup tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "📧 Email test etmek için VPS'te şu komutu çalıştırın:" -ForegroundColor Cyan
Write-Host "   curl -X POST http://localhost:5000/api/email/verification \" -ForegroundColor Gray
Write-Host "     -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "     -d '{\"email\":\"test@example.com\",\"username\":\"TestUser\",\"verifyUrl\":\"https://www.pornras.com/verify?token=test\"}'" -ForegroundColor Gray
Write-Host ""

