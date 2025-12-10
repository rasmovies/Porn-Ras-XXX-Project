$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

Write-Host "[1/4] VPS'e baglaniyor..." -ForegroundColor Cyan
$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[2/4] server.js dosyasi kontrol ediliyor..." -ForegroundColor Cyan
$FileCheck = Invoke-VpsCmd "cd $BackendPath && head -30 server.js"
Write-Host $FileCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Node.js versiyonu kontrol ediliyor..." -ForegroundColor Cyan
$NodeVersion = Invoke-VpsCmd "node --version"
Write-Host "Node.js: $($NodeVersion.Output)" -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] server.js dosyasinin ilk 50 satiri:" -ForegroundColor Cyan
$FileHead = Invoke-VpsCmd "cd $BackendPath && head -50 server.js"
Write-Host $FileHead.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

