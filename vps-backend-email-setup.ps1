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

Write-Host "[1/4] PM2'den backend dizinini buluyorum..." -ForegroundColor Cyan
$Pm2Cwd = Invoke-VpsCmd "pm2 describe adulttube-backend 2>&1 | grep 'cwd'"
Write-Host $Pm2Cwd.Output -ForegroundColor Gray

# CWD'yi çıkar
$BackendPath = "/var/www/adulttube-backend/server"
if ($Pm2Cwd.Output -match "cwd.*?(\S+)\s*\n") {
    $FoundPath = $matches[1].Trim()
    if ($FoundPath) {
        $BackendPath = $FoundPath
        if ($BackendPath -notmatch "server$" -and -not (Test-Path $BackendPath)) {
            $BackendPath = $BackendPath + "/server"
        }
    }
}

Write-Host "Backend dizini: $BackendPath" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] .env dosyasini guncelliyorum..." -ForegroundColor Cyan

# .env dosyasını satır satır oluştur
$EnvUpdate = Invoke-VpsCmd "cd $BackendPath; if [ -f .env ]; then cp .env .env.backup.`$(date +%Y%m%d_%H%M%S); fi; echo 'PORT=5000' > .env; echo 'NODE_ENV=production' >> .env; echo 'PROTON_SMTP_HOST=127.0.0.1' >> .env; echo 'PROTON_SMTP_PORT=1025' >> .env; echo 'PROTON_SMTP_SECURE=false' >> .env; echo 'PROTON_SMTP_USERNAME=pornras@proton.me' >> .env; echo 'PROTON_SMTP_PASSWORD=MoQL_M-Loyi1fB3b9tKWew' >> .env; echo 'PROTON_FROM_EMAIL=pornras@proton.me' >> .env; echo 'PROTON_FROM_NAME=PORNRAS' >> .env; echo 'ENV_UPDATED'; cat .env"
Write-Host $EnvUpdate.Output -ForegroundColor White
Write-Host ""

Write-Host "[3/4] Backend'i yeniden baslatiyorum..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd "pm2 restart adulttube-backend; sleep 3; pm2 status adulttube-backend | head -2"
Write-Host $Restart.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/4] Backend health check..." -ForegroundColor Cyan
$Health = Invoke-VpsCmd "curl -s http://localhost:5000/health 2>&1 | head -5"
Write-Host $Health.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND LINK BILGILERI" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "BACKEND URL:" -ForegroundColor Green
Write-Host "  http://$VpsIp`:5000" -ForegroundColor Green
Write-Host ""
Write-Host "API ENDPOINTS:" -ForegroundColor Cyan
Write-Host "  http://$VpsIp`:5000/health" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:5000/api/email/verification" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:5000/api/email/invite" -ForegroundColor Gray
Write-Host "  http://$VpsIp`:5000/api/email/marketing" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "ENTEGRASYON TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend artik VPS'teki Proton Mail Bridge'i kullaniyor!" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

