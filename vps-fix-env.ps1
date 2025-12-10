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

Write-Host "[1/3] .env dosyasi temizleniyor..." -ForegroundColor Cyan

$CleanEnv = @"
PORT=5000
NODE_ENV=production
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=MoQL_M-Loyi1fB3b9tKWew
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS
"@

$CleanEnvBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($CleanEnv))

$FixCmd = @"
cd $BackendPath
cp .env .env.old
echo '$CleanEnvBase64' | base64 -d > .env
chmod 600 .env
cat .env
"@

$FixResult = Invoke-VpsCmd $FixCmd
Write-Host $FixResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 3

Write-Host "[3/3] Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson' 2>&1"
Write-Host $TestResult.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 5 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ".env DOSYASI DUZELTILDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

