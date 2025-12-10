$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API ENDPOINT TEST VE SORUN GIDERME" -ForegroundColor Cyan
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

Write-Host "[1/6] Backend durumu..." -ForegroundColor Cyan
$BackendStatus = Invoke-VpsCmd "pm2 list | grep adulttube-backend"
Write-Host $BackendStatus.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/6] Backend health check..." -ForegroundColor Cyan
$HealthCheck = Invoke-VpsCmd "curl -s http://localhost:5000/health 2>&1"
Write-Host $HealthCheck.Output -ForegroundColor $(if ($HealthCheck.Output -match "OK") { "Green" } else { "Red" })
Write-Host ""

Write-Host "[3/6] api.pornras.com HTTPS test..." -ForegroundColor Cyan
$HTTPSHealth = Invoke-VpsCmd "curl -s https://api.pornras.com/health 2>&1"
Write-Host $HTTPSHealth.Output -ForegroundColor $(if ($HTTPSHealth.Output -match "OK") { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "[4/6] Email endpoint test (POST)..." -ForegroundColor Cyan
$EmailTest = Invoke-VpsCmd @"
curl -s -X POST https://api.pornras.com/api/email/verification \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://www.pornras.com' \
  -d '{\"email\":\"test@test.com\",\"username\":\"test\",\"verifyUrl\":\"https://test.com\"}' \
  2>&1 | head -10
"@
Write-Host $EmailTest.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[5/6] CORS test (OPTIONS preflight)..." -ForegroundColor Cyan
$CORSTest = Invoke-VpsCmd @"
curl -s -X OPTIONS https://api.pornras.com/api/email/verification \
  -H 'Origin: https://www.pornras.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  -v 2>&1 | grep -E '(HTTP|Access-Control|Origin)' | head -10
"@
Write-Host $CORSTest.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[6/6] Backend CORS ayarlari kontrol..." -ForegroundColor Cyan
$CORSCheck = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
grep -A 20 "origin: function\|allowedOrigins\|www.pornras.com" server.js | head -25
"@
Write-Host $CORSCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[7/7] Nginx CORS headers kontrol..." -ForegroundColor Cyan
$NginxCORS = Invoke-VpsCmd "grep -A 5 'Access-Control' /etc/nginx/sites-available/api.pornras.com | head -10"
Write-Host $NginxCORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


