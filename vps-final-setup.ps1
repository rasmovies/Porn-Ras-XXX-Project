$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FINAL SETUP: BACKEND RESTART" -ForegroundColor Cyan
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

Write-Host "[1/3] Backend durumu kontrol ediliyor..." -ForegroundColor Cyan
$Status = Invoke-VpsCmd "pm2 list | grep adulttube-backend"
Write-Host $Status.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] Backend CORS ayarlari kontrol ediliyor..." -ForegroundColor Cyan
$CORS = Invoke-VpsCmd "grep -A 10 'allowedOrigins' /var/www/adulttube-backend/server/server.js | head -12"
Write-Host $CORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/3] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd @"
pm2 restart adulttube-backend
sleep 3
pm2 logs adulttube-backend --lines 5 --nostream 2>&1 | tail -5
"@
Write-Host $Restart.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/4] Final test..." -ForegroundColor Cyan
$Test = Invoke-VpsCmd @"
echo '=== api.pornras.com HTTPS Test ==='
curl -s https://api.pornras.com/health 2>&1
echo ''
echo '=== CORS Test ==='
curl -s -X OPTIONS https://api.pornras.com/api/email/verification \
  -H 'Origin: https://www.pornras.com' \
  -H 'Access-Control-Request-Method: POST' \
  -v 2>&1 | grep -E '(HTTP|Access-Control)' | head -5
"@
Write-Host $Test.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "SETUP TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "SON ADIM: VERCEL ENVIRONMENT VARIABLE" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Vercel Dashboard -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "2. REACT_APP_API_BASE_URL = https://api.pornras.com" -ForegroundColor White
Write-Host "3. Production, Preview, Development (hepsinde)" -ForegroundColor White
Write-Host "4. Deployments -> Redeploy" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


