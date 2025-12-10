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

Write-Host "[1/3] .env dosyasi kontrol:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && cat .env | head -10"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] emailService.js SMTP konfigurasyon bolumu:" -ForegroundColor Cyan
$EmailService = Invoke-VpsCmd "cd $BackendPath && grep -A 10 'PROTON_SMTP_HOST' services/emailService.js"
Write-Host $EmailService.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Environment variable test:" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); console.log('HOST:', process.env.PROTON_SMTP_HOST); console.log('PORT:', process.env.PROTON_SMTP_PORT); console.log('USER:', process.env.PROTON_SMTP_USERNAME);`""
Write-Host $EnvTest.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

