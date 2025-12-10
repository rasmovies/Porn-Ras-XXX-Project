$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

Write-Host "[1/5] VPS'e baglaniyor..." -ForegroundColor Cyan
$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[2/5] Backend durduruluyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete adulttube-backend" | Out-Null

Write-Host "[3/5] server.js dosyasi kontrol ediliyor..." -ForegroundColor Cyan
$FileCheck = Invoke-VpsCmd "cd $BackendPath && head -5 server.js && echo '---' && wc -l server.js"
Write-Host $FileCheck.Output -ForegroundColor Gray

Write-Host "[4/5] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
$StartCmd = "cd $BackendPath && pm2 start server.js --name adulttube-backend --update-env"
$StartResult = Invoke-VpsCmd $StartCmd
Write-Host $StartResult.Output -ForegroundColor Gray

Start-Sleep -Seconds 5

Write-Host "[5/5] Loglar kontrol ediliyor..." -ForegroundColor Cyan
$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 15 --nostream 2>&1"
Write-Host $Logs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Backend durumu:" -ForegroundColor Cyan
$Status = Invoke-VpsCmd "pm2 status"
Write-Host $Status.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

