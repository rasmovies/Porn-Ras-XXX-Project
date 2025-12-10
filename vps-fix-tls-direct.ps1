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

Write-Host "emailService.js'ye TLS konfigurasyonu ekleniyor..." -ForegroundColor Cyan

# sed ile tls ekle
$FixCmd = @"
cd $BackendPath/services
sed -i "/auth: PROTON_SMTP_USERNAME/i\\
    tls: {\\
      rejectUnauthorized: false, // Proton Mail Bridge self-signed certificate\\
    }," emailService.js
grep -A 12 'nodemailer.createTransport' emailService.js
"@

$FixResult = Invoke-VpsCmd $FixCmd
Write-Host $FixResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host $TestResult.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 3 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

