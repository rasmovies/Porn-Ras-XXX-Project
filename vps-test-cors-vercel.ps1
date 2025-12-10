$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND CORS VE ERISIM TESTI" -ForegroundColor Cyan
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

$BackendPath = "/var/www/adulttube-backend/server"

Write-Host "[1/5] Backend durumunu kontrol ediyorum..." -ForegroundColor Cyan
$BackendStatus = Invoke-VpsCmd "pm2 status adulttube-backend | head -5"
Write-Host $BackendStatus.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/5] Backend port kontrolu..." -ForegroundColor Cyan
$PortCheck = Invoke-VpsCmd "netstat -tlnp | grep :5000 || ss -tlnp | grep :5000"
Write-Host $PortCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/5] CORS ayarlarini kontrol ediyorum..." -ForegroundColor Cyan
$CorsCheck = Invoke-VpsCmd "cd $BackendPath && grep -A 30 'CORS ayarlari' server.js | head -35"
Write-Host $CorsCheck.Output -ForegroundColor White
Write-Host ""

Write-Host "[4/5] CORS testi (Vercel origin ile)..." -ForegroundColor Cyan
$VercelOrigins = @(
    "https://server-three-swart-99.vercel.app",
    "https://www.pornras.com",
    "https://porn-ras-xxx-project.vercel.app"
)

foreach ($origin in $VercelOrigins) {
    Write-Host "Testing origin: $origin" -ForegroundColor Yellow
    $TestCmd = "curl -s -X OPTIONS -H 'Origin: $origin' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type' http://localhost:5000/api/email/verification -v 2>&1 | grep -iE 'access-control|HTTP/|origin' | head -10"
    $TestResult = Invoke-VpsCmd $TestCmd
    Write-Host $TestResult.Output -ForegroundColor $(if ($TestResult.Output -match "access-control-allow") { "Green" } else { "Red" })
    Write-Host ""
}

Write-Host "[5/5] Backend health ve erisim testi..." -ForegroundColor Cyan
$HealthTest = Invoke-VpsCmd "curl -s http://localhost:5000/health && echo '' && curl -s http://$VpsIp:5000/health 2>&1 | head -5"
Write-Host $HealthTest.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIREWALL KONTROLU" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Port 5000'in dis erisime acik olup olmadigini kontrol ediyorum..." -ForegroundColor Cyan
$FirewallCheck = Invoke-VpsCmd "ufw status | grep 5000 || iptables -L -n | grep 5000 || echo 'Firewall kurali bulunamadi - port acik olabilir'"
Write-Host $FirewallCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Vercel'den backend'e erisim icin:" -ForegroundColor White
Write-Host "1. Port 5000'in dis erisime acik olmasi gerekir" -ForegroundColor Gray
Write-Host "2. CORS ayarlarinda Vercel domain'leri olmali" -ForegroundColor Gray
Write-Host "3. Backend calisiyor olmali" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



