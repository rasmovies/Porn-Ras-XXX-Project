$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS BACKEND EMAIL ENTEGRASYONU (FINAL)" -ForegroundColor Cyan
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

Write-Host "[1/5] PM2'den backend dizinini buluyorum..." -ForegroundColor Cyan
$Pm2Info = Invoke-VpsCmd "pm2 describe adulttube-backend 2>&1 | grep -E 'cwd|script|name' | head -5"
Write-Host $Pm2Info.Output -ForegroundColor Gray
Write-Host ""

# PM2'den cwd'yi al
$GetCwd = Invoke-VpsCmd "pm2 describe adulttube-backend 2>&1 | grep 'cwd' | awk '{print \$NF}'"
$BackendPath = $GetCwd.Output.Trim()

if (-not $BackendPath -or $BackendPath -match "grep|error|not found") {
    # Alternatif: PM2 info'dan çıkar
    $GetCwdAlt = Invoke-VpsCmd "pm2 jlist 2>&1 | grep -o '\"cwd\":\"[^\"]*\"' | head -1 | sed 's/.*\"cwd\":\"\\([^\"]*\\).*/\\1/'"
    $BackendPath = $GetCwdAlt.Output.Trim()
}

if (-not $BackendPath -or $BackendPath -match "grep|error") {
    $BackendPath = "/root/adulttube/server"
    Write-Host "Varsayilan backend dizini kullaniliyor: $BackendPath" -ForegroundColor Yellow
} else {
    Write-Host "Backend dizini bulundu: $BackendPath" -ForegroundColor Green
}
Write-Host ""

Write-Host "[2/5] Backend dizinini kontrol ediyorum..." -ForegroundColor Cyan
$CheckDir = Invoke-VpsCmd "test -d $BackendPath && ls -la $BackendPath/server.js $BackendPath/.env* 2>&1 | head -3 || echo 'Directory check failed'"
Write-Host $CheckDir.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/5] Bridge SMTP ayarlarini .env dosyasina ekliyorum..." -ForegroundColor Cyan

# .env içeriği
$EnvLines = @"
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

# .env dosyasını güncelle
$EnvContentEscaped = $EnvLines -replace '"', '\"' -replace '\$', '\$'
$UpdateEnv = Invoke-VpsCmd "cd $BackendPath && if [ -f .env ]; then cp .env .env.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null; fi && echo '$EnvContentEscaped' > .env && echo 'ENV_UPDATED' && cat .env"

Write-Host $UpdateEnv.Output -ForegroundColor White
Write-Host ""

Write-Host "[4/5] Backend portunu kontrol ediyorum..." -ForegroundColor Cyan
$PortInfo = Invoke-VpsCmd "cd $BackendPath && grep '^PORT=' .env 2>/dev/null || echo 'PORT=5000'"
$BackendPort = "5000"
if ($PortInfo.Output -match "PORT=(\d+)") {
    $BackendPort = $matches[1]
}
Write-Host "Backend port: $BackendPort" -ForegroundColor Green
Write-Host ""

Write-Host "[5/5] Backend'i yeniden baslatiyorum..." -ForegroundColor Cyan
$RestartBackend = Invoke-VpsCmd "pm2 restart adulttube-backend 2>&1 && sleep 2 && pm2 status adulttube-backend 2>&1 | head -2"
Write-Host $RestartBackend.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND LINK BILGILERI:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "VPS IP: $VpsIp" -ForegroundColor White
Write-Host "Backend Port: $BackendPort" -ForegroundColor White
Write-Host "Backend Dizini: $BackendPath" -ForegroundColor White
Write-Host ""
Write-Host "BACKEND URL:" -ForegroundColor Green
Write-Host "  http://$VpsIp`:$BackendPort" -ForegroundColor Green
Write-Host ""
Write-Host "API ENDPOINTS:" -ForegroundColor Cyan
Write-Host "  http://$VpsIp`:$BackendPort/health" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:$BackendPort/api/email/verification" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:$BackendPort/api/email/invite" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:$BackendPort/api/email/marketing" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ENTEGRASYON TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Email servisi artik VPS'teki Proton Mail Bridge'i kullaniyor!" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

