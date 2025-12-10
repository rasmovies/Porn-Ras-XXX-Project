$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LET'S ENCRYPT SSL SERTIFIKA KURULUMU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

try {
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ConnectionTimeout 30
    Write-Host "SSH baglantisi kuruldu!" -ForegroundColor Green
} catch {
    Write-Host "SSH baglantisi kurulamadi: $_" -ForegroundColor Red
    exit 1
}

function Invoke-VpsCmd {
    param([string]$Cmd)
    try {
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 120
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/4] Certbot kurulumunu kontrol ediyorum..." -ForegroundColor Cyan
$CertbotCheck = Invoke-VpsCmd "which certbot || echo 'Certbot yok'"
Write-Host $CertbotCheck.Output -ForegroundColor Gray

if ($CertbotCheck.Output -match "yok") {
    Write-Host "Certbot kuruluyor..." -ForegroundColor Yellow
    $InstallCertbot = Invoke-VpsCmd "apt-get update -qq && apt-get install -y certbot python3-certbot-nginx 2>&1 | tail -5"
    Write-Host $InstallCertbot.Output -ForegroundColor Gray
} else {
    Write-Host "Certbot kurulu!" -ForegroundColor Green
}
Write-Host ""

Write-Host "[2/4] Let's Encrypt sertifikasi aliniyor..." -ForegroundColor Cyan
Write-Host "Domain: api.pornras.com" -ForegroundColor White
Write-Host ""

$LetsEncrypt = Invoke-VpsCmd @"
# Let's Encrypt sertifikasi al
certbot --nginx \
  -d api.pornras.com \
  --non-interactive \
  --agree-tos \
  --email admin@pornras.com \
  --redirect \
  2>&1
"@
Write-Host $LetsEncrypt.Output -ForegroundColor $(if ($LetsEncrypt.Output -match "Successfully" -or $LetsEncrypt.Output -match "Congratulations") { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "[3/4] SSL sertifika durumunu kontrol ediyorum..." -ForegroundColor Cyan
$CertStatus = Invoke-VpsCmd @"
certbot certificates 2>&1 | grep -A 5 api.pornras.com || echo 'Sertifika bulunamadi'
ls -lh /etc/letsencrypt/live/api.pornras.com/*.pem 2>&1 | head -3 || echo 'Let'\''s Encrypt sertifikasi yok'
"@
Write-Host $CertStatus.Output -ForegroundColor Gray
Write-Host ""

if ($LetsEncrypt.Output -match "Successfully" -or $LetsEncrypt.Output -match "Congratulations" -or $CertStatus.Output -match ".pem") {
    Write-Host "[4/4] Let's Encrypt sertifikasi basariyla kuruldu!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test ediliyor..." -ForegroundColor Cyan
    $TestSSL = Invoke-VpsCmd @"
curl -s https://api.pornras.com/health 2>&1 | head -3
echo ''
echo 'Sertifika bilgisi:'
openssl s_client -connect api.pornras.com:443 -servername api.pornras.com </dev/null 2>/dev/null | grep -E '(subject=|issuer=)' | head -2
"@
    Write-Host $TestSSL.Output -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "api.pornras.com artik Let's Encrypt SSL sertifikasi ile calisiyor!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[4/4] Let's Encrypt kurulumu basarisiz, self-signed cert kullanilacak" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OLASI NEDENLER:" -ForegroundColor Yellow
    Write-Host "1. Port 80 erisilemiyor (firewall)" -ForegroundColor White
    Write-Host "2. DNS propagation henuz tamamlanmamis" -ForegroundColor White
    Write-Host "3. Let's Encrypt rate limit (cok deneme yapildi)" -ForegroundColor White
    Write-Host ""
    Write-Host "GECICI COZUM: Self-signed cert ile devam edilecek" -ForegroundColor Yellow
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


