# VPS Email Setup - PowerShell Komutları
# Bu dosya VPS'e SSH ile bağlanıp manuel komutlar çalıştırmak için yardımcı fonksiyonlar içerir

# Posh-SSH modülünü yükle (eğer yoksa)
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "Posh-SSH modülü yükleniyor..." -ForegroundColor Yellow
    Install-Module -Name Posh-SSH -Scope CurrentUser -Force -AllowClobber
}

Import-Module Posh-SSH

# VPS'e bağlanma fonksiyonu
function Connect-Vps {
    param(
        [Parameter(Mandatory=$true)]
        [string]$VpsIp,
        
        [Parameter(Mandatory=$false)]
        [string]$VpsUser = "root"
    )
    
    $Password = Read-Host "VPS şifresi" -AsSecureString
    $Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $Password)
    
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey
    return $Session
}

# VPS'te komut çalıştırma fonksiyonu
function Invoke-VpsCommand {
    param(
        [Parameter(Mandatory=$true)]
        [object]$Session,
        
        [Parameter(Mandatory=$true)]
        [string]$Command
    )
    
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Command
    return $Result
}

# ============================================
# KULLANIM ÖRNEKLERİ
# ============================================

# 1. VPS'e bağlan
# $Session = Connect-Vps -VpsIp "your-vps-ip"

# 2. Proton Mail Bridge durumunu kontrol et
# $Result = Invoke-VpsCommand -Session $Session -Command "systemctl status proton-bridge"
# Write-Host $Result.Output

# 3. Bridge SMTP bilgilerini al
# $Result = Invoke-VpsCommand -Session $Session -Command "sudo journalctl -u proton-bridge -n 100 | grep -i smtp"
# Write-Host $Result.Output

# 4. Backend dizinine git ve .env dosyasını düzenle
# $Result = Invoke-VpsCommand -Session $Session -Command "cd /var/www/adulttube-backend/server && nano .env"
# (Not: Nano etkileşimli olduğu için bu komut çalışmayabilir, dosyayı PowerShell'de düzenleyip yükle)

# 5. .env dosyasını oluştur
# $EnvContent = @"
# PORT=5000
# NODE_ENV=production
# PROTON_SMTP_HOST=127.0.0.1
# PROTON_SMTP_PORT=1025
# PROTON_SMTP_SECURE=false
# PROTON_SMTP_USERNAME=sen@proton.me
# PROTON_SMTP_PASSWORD=bridge-password
# PROTON_FROM_EMAIL=sen@proton.me
# PROTON_FROM_NAME=PORNRAS
# "@
# $EnvContentBytes = [System.Text.Encoding]::UTF8.GetBytes($EnvContent)
# $EnvBase64 = [Convert]::ToBase64String($EnvContentBytes)
# $Result = Invoke-VpsCommand -Session $Session -Command "cd /var/www/adulttube-backend/server && echo '$EnvBase64' | base64 -d > .env && chmod 600 .env"

# 6. Backend'i yeniden başlat
# $Result = Invoke-VpsCommand -Session $Session -Command "cd /var/www/adulttube-backend/server && pm2 restart adulttube-backend"

# 7. Logları kontrol et
# $Result = Invoke-VpsCommand -Session $Session -Command "pm2 logs adulttube-backend --lines 50 --nostream"
# Write-Host $Result.Output

# 8. Bağlantıyı kapat
# Remove-SSHSession -SessionId $Session.SessionId

# ============================================
# HIZLI SETUP FONKSİYONU
# ============================================

function Setup-VpsEmail {
    param(
        [Parameter(Mandatory=$true)]
        [string]$VpsIp,
        
        [Parameter(Mandatory=$false)]
        [string]$VpsUser = "root",
        
        [Parameter(Mandatory=$false)]
        [string]$SmtpHost = "127.0.0.1",
        
        [Parameter(Mandatory=$false)]
        [string]$SmtpPort = "1025",
        
        [Parameter(Mandatory=$false)]
        [string]$SmtpUsername = "",
        
        [Parameter(Mandatory=$false)]
        [string]$SmtpPassword = "",
        
        [Parameter(Mandatory=$false)]
        [string]$BackendPath = "/var/www/adulttube-backend/server"
    )
    
    Write-Host "🚀 VPS Email Setup Başlatılıyor..." -ForegroundColor Cyan
    
    # VPS'e bağlan
    $Session = Connect-Vps -VpsIp $VpsIp -VpsUser $VpsUser
    
    if (-not $Session) {
        Write-Host "❌ VPS'e bağlanılamadı!" -ForegroundColor Red
        return
    }
    
    Write-Host "✅ VPS'e bağlanıldı" -ForegroundColor Green
    
    # .env içeriğini hazırla
    $EnvContent = @"
PORT=5000
NODE_ENV=production
PROTON_SMTP_HOST=$SmtpHost
PROTON_SMTP_PORT=$SmtpPort
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=$SmtpUsername
PROTON_SMTP_PASSWORD=$SmtpPassword
PROTON_FROM_EMAIL=$SmtpUsername
PROTON_FROM_NAME=PORNRAS
"@
    
    # .env dosyasını base64 encode et ve VPS'e yükle
    $EnvContentBytes = [System.Text.Encoding]::UTF8.GetBytes($EnvContent)
    $EnvBase64 = [Convert]::ToBase64String($EnvContentBytes)
    
    $CreateEnvCmd = @"
cd $BackendPath
echo '$EnvBase64' | base64 -d > .env
chmod 600 .env
cat .env
"@
    
    Write-Host "📝 .env dosyası oluşturuluyor..." -ForegroundColor Cyan
    $Result = Invoke-VpsCommand -Session $Session -Command $CreateEnvCmd
    Write-Host $Result.Output
    
    # Backend'i yeniden başlat
    Write-Host "🔄 Backend yeniden başlatılıyor..." -ForegroundColor Cyan
    $RestartResult = Invoke-VpsCommand -Session $Session -Command "cd $BackendPath && pm2 restart adulttube-backend || pm2 start server.js --name adulttube-backend"
    Write-Host $RestartResult.Output
    
    # Logları göster
    Write-Host "📊 Backend logları:" -ForegroundColor Cyan
    $LogsResult = Invoke-VpsCommand -Session $Session -Command "pm2 logs adulttube-backend --lines 20 --nostream"
    Write-Host $LogsResult.Output
    
    # Bağlantıyı kapat
    Remove-SSHSession -SessionId $Session.SessionId | Out-Null
    
    Write-Host "✅ Setup tamamlandı!" -ForegroundColor Green
}

# Kullanım örneği:
# Setup-VpsEmail -VpsIp "your-vps-ip" -SmtpUsername "sen@proton.me" -SmtpPassword "bridge-password"

