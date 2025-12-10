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

Write-Host "emailService.js transporter konfigurasyonu:" -ForegroundColor Cyan
$TransporterCheck = Invoke-VpsCmd "cd $BackendPath && grep -A 10 'nodemailer.createTransport' services/emailService.js"
Write-Host $TransporterCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "PM2 tamamen durdurulup yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete all && pm2 kill" | Out-Null
Start-Sleep -Seconds 3

Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host $TestResult.Output -ForegroundColor Gray

$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 3 --nostream 2>&1"
Write-Host ""
Write-Host "Son hata loglari:" -ForegroundColor Red
Write-Host $ErrorLogs.Output -ForegroundColor Red

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

