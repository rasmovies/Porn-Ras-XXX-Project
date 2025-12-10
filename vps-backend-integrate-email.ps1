$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS BACKEND EMAIL ENTEGRASYONU" -ForegroundColor Cyan
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
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 60
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/5] Backend dizinini buluyorum..." -ForegroundColor Cyan
$BackendDir = Invoke-VpsCmd @"
# Backend dizinlerini ara
find /root /home -type d -name 'server' -o -name 'adulttube' 2>/dev/null | head -5
# PM2 ile calisan process'leri kontrol et
pm2 list 2>&1 | grep -E 'server|backend|node' || echo 'PM2 not running'
"@

Write-Host $BackendDir.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/5] Backend dizinini belirliyorum..." -ForegroundColor Cyan
# Backend dizinini bul (en yaygın lokasyonlar)
$BackendPath = "/root/adulttube/server"
$CheckBackend = Invoke-VpsCmd "test -d $BackendPath && echo 'EXISTS' || echo 'NOT_FOUND'"
if ($CheckBackend.Output -notmatch "EXISTS") {
    $BackendPath = "/root/server"
    $CheckBackend = Invoke-VpsCmd "test -d $BackendPath && echo 'EXISTS' || echo 'NOT_FOUND'"
}

if ($CheckBackend.Output -match "EXISTS") {
    Write-Host "Backend dizini bulundu: $BackendPath" -ForegroundColor Green
} else {
    Write-Host "Backend dizini bulunamadi. Manuel kontrol gerekli." -ForegroundColor Yellow
    $BackendPath = "/root/adulttube/server"  # Varsayılan olarak kullan
}

Write-Host ""
Write-Host "[3/5] Backend .env dosyasini kontrol ediyorum..." -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && ls -la .env* 2>&1 | head -5"
Write-Host $EnvCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/5] Bridge SMTP bilgilerini .env dosyasina ekliyorum..." -ForegroundColor Cyan

# Bridge SMTP ayarları (varsayılan)
$EnvContent = @"
# Backend Server Settings
PORT=5000
NODE_ENV=production

# Proton Mail Bridge SMTP Settings
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=MoQL_M-Loyi1fB3b9tKWew
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS
"@

# .env dosyasını oluştur veya güncelle
$UpdateEnv = Invoke-VpsCmd @"
cd $BackendPath

# Mevcut .env dosyasını yedekle
if [ -f .env ]; then
    cp .env .env.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null
fi

# .env dosyasını oluştur veya güncelle
cat > .env << 'ENVEOF'
$EnvContent
ENVEOF

echo 'ENV_FILE_UPDATED'
cat .env
"@

Write-Host $UpdateEnv.Output -ForegroundColor White
Write-Host ""

Write-Host "[5/5] Backend portunu ve URL'ini kontrol ediyorum..." -ForegroundColor Cyan
$PortCheck = Invoke-VpsCmd @"
# Backend portunu .env'den oku
cd $BackendPath
grep '^PORT=' .env 2>/dev/null || echo 'PORT=5000'

# PM2 ile calisan backend process'lerini kontrol et
pm2 list 2>&1 | grep -E 'server|backend|node|5000' || echo 'PM2 processes'
"@

Write-Host $PortCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$BackendPort = "5000"
if ($PortCheck.Output -match "PORT=(\d+)") {
    $BackendPort = $matches[1]
}

Write-Host "BACKEND LINK:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "VPS IP: $VpsIp" -ForegroundColor White
Write-Host "Backend Port: $BackendPort" -ForegroundColor White
Write-Host ""
Write-Host "Backend URL:" -ForegroundColor Cyan
Write-Host "  http://$VpsIp`:$BackendPort" -ForegroundColor Green
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "  http://$VpsIp`:$BackendPort/health" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:$BackendPort/api/email/verification" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:$BackendPort/api/email/invite" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:$BackendPort/api/email/marketing" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Backend'i yeniden baslat:" -ForegroundColor White
Write-Host "   cd $BackendPath" -ForegroundColor Gray
Write-Host "   pm2 restart all" -ForegroundColor Gray
Write-Host "   veya" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Email servisini test et:" -ForegroundColor White
Write-Host "   curl http://$VpsIp`:$BackendPort/health" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Frontend'den backend'e istek gonder:" -ForegroundColor White
Write-Host "   API Base URL: http://$VpsIp`:$BackendPort" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



