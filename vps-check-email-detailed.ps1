$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/5] Backend error loglari (son 10 satir):" -ForegroundColor Red
$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1"
Write-Host $ErrorLogs.Output -ForegroundColor Red

Write-Host ""
Write-Host "[2/5] Email template dosyalari kontrol:" -ForegroundColor Cyan
$Templates = Invoke-VpsCmd "cd $BackendPath && ls -la emailTemplates/ 2>&1 || ls -la ../emailTemplates/ 2>&1 || find . -name '*.html' -type f | grep email"
Write-Host $Templates.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] SMTP baglanti testi:" -ForegroundColor Cyan
$SmtpTest = Invoke-VpsCmd "timeout 2 nc -zv 127.0.0.1 1025 2>&1 || echo 'Timeout'"
Write-Host $SmtpTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Bridge durumu:" -ForegroundColor Cyan
$Bridge = Invoke-VpsCmd "systemctl status protonmail-bridge --no-pager | head -10"
Write-Host $Bridge.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] Email test (detayli):" -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -v -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson' 2>&1 | tail -20"
Write-Host $TestResult.Output -ForegroundColor Gray

# Hata loglarını tekrar kontrol et
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Son error loglari:" -ForegroundColor Red
$LatestErrors = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 5 --nostream 2>&1 | tail -5"
Write-Host $LatestErrors.Output -ForegroundColor Red

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

