$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HTTPS BACKEND DIAGNOSTIC" -ForegroundColor Cyan
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

Write-Host "[1/6] Backend process kontrolu (PM2)..." -ForegroundColor Cyan
$PM2Status = Invoke-VpsCmd "pm2 list 2>&1"
Write-Host $PM2Status.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/6] Backend port 5000 kontrolu..." -ForegroundColor Cyan
$Port5000 = Invoke-VpsCmd "netstat -tlnp | grep :5000 || ss -tlnp | grep :5000 || echo 'Port 5000 dinlenmiyor'"
Write-Host $Port5000.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/6] Backend local test (HTTP)..." -ForegroundColor Cyan
$BackendTest = Invoke-VpsCmd "curl -s http://localhost:5000/health 2>&1 | head -3 || echo 'Backend yanit vermiyor'"
Write-Host $BackendTest.Output -ForegroundColor $(if ($BackendTest.Output -match "OK") { "Green" } else { "Red" })
Write-Host ""

Write-Host "[4/6] Nginx durumu..." -ForegroundColor Cyan
$NginxStatus = Invoke-VpsCmd "systemctl status nginx | head -10"
Write-Host $NginxStatus.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[5/6] Nginx port 443 kontrolu..." -ForegroundColor Cyan
$Port443 = Invoke-VpsCmd "netstat -tlnp | grep :443 || ss -tlnp | grep :443 || echo 'Port 443 dinlenmiyor'"
Write-Host $Port443.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[6/6] HTTPS local test..." -ForegroundColor Cyan
$HTTPSLocal = Invoke-VpsCmd "curl -k -s https://localhost/api/email/verification -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\"}' 2>&1 | head -5"
Write-Host $HTTPSLocal.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[7/7] Firewall kontrolu..." -ForegroundColor Cyan
$Firewall = Invoke-VpsCmd "ufw status 2>&1 | head -5 || iptables -L -n | grep -E '(443|5000)' | head -5 || echo 'Firewall kontrol edilemedi'"
Write-Host $Firewall.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[8/8] Nginx error log (son 10 satir)..." -ForegroundColor Cyan
$NginxError = Invoke-VpsCmd "tail -10 /var/log/nginx/error.log 2>&1 || echo 'Log bulunamadi'"
Write-Host $NginxError.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "OZET:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


