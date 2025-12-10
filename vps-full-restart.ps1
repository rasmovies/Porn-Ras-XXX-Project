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

Write-Host "[1/4] .env dosyasi kontrol ediliyor..." -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && cat .env"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] PM2 tamamen durduruluyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete all 2>&1" | Out-Null
Invoke-VpsCmd "pm2 kill 2>&1" | Out-Null
Start-Sleep -Seconds 2

Write-Host "[3/4] PM2 yeniden baslatiliyor ve backend baslatiliyor..." -ForegroundColor Cyan
$StartResult = Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend"
Write-Host $StartResult.Output -ForegroundColor Gray

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[4/4] Environment variable test (yeni process):" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); console.log('HOST:', JSON.stringify(process.env.PROTON_SMTP_HOST)); console.log('PORT:', JSON.stringify(process.env.PROTON_SMTP_PORT));`""
Write-Host $EnvTest.Output -ForegroundColor Gray

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 3 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host $TestResult.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

