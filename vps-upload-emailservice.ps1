$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"
$LocalFile = "C:\Users\User\Desktop\adulttube\server\services\emailService.js"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[1/3] emailService.js dosyasi okunuyor..." -ForegroundColor Cyan
$FileContent = Get-Content $LocalFile -Raw -Encoding UTF8
$FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
$Base64Content = [Convert]::ToBase64String($FileBytes)

Write-Host "[2/3] emailService.js VPS'e yukleniyor..." -ForegroundColor Cyan
$UploadCmd = @"
cd $BackendPath/services
cp emailService.js emailService.js.backup
echo '$Base64Content' | base64 -d > emailService.js
chmod 644 emailService.js
head -35 emailService.js
"@

$UploadResult = Invoke-VpsCmd $UploadCmd
Write-Host $UploadResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host $TestResult.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 5 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "EMAILSERVICE.JS GUNCELLENDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

