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

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND DURUM KONTROLU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] PM2 Durumu:" -ForegroundColor Cyan
$Status = Invoke-VpsCmd "pm2 status"
Write-Host $Status.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Backend Health Check:" -ForegroundColor Cyan
$Health = Invoke-VpsCmd "curl -s http://localhost:5000/health"
Write-Host $Health.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] .env Dosyasi Kontrol:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && cat .env | grep -E 'PROTON_SMTP|PROTON_FROM'"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Proton Mail Bridge Durumu:" -ForegroundColor Cyan
$BridgeStatus = Invoke-VpsCmd "systemctl is-active protonmail-bridge"
Write-Host "Bridge: $($BridgeStatus.Output.Trim())" -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] Email API Test:" -ForegroundColor Cyan
$TestJson = @{
    email = "test@example.com"
    username = "TestUser"
    verifyUrl = "https://www.pornras.com/verify?token=test123"
} | ConvertTo-Json -Compress

$TestCmd = "curl -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson' 2>&1"
$TestResult = Invoke-VpsCmd $TestCmd
Write-Host $TestResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "KONTROL TAMAMLANDI" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

