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

Write-Host "server.js ilk 30 satir:" -ForegroundColor Cyan
$Head = Invoke-VpsCmd "cd $BackendPath && head -30 server.js"
Write-Host $Head.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Hata loglari:" -ForegroundColor Red
$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 5 --nostream 2>&1"
Write-Host $ErrorLogs.Output -ForegroundColor Red

Write-Host ""
Write-Host "Node.js ile direkt test:" -ForegroundColor Yellow
$NodeTest = Invoke-VpsCmd "cd $BackendPath && node -c server.js 2>&1"
Write-Host $NodeTest.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

