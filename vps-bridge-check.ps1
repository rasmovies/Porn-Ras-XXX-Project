$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "[1/3] VPS'e baglaniyor..." -ForegroundColor Cyan
$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[2/3] Bridge servis adi bulunuyor..." -ForegroundColor Cyan
$ServiceCheck = Invoke-VpsCmd "systemctl list-units --type=service | grep -i proton"
Write-Host "Proton servisleri:" -ForegroundColor Yellow
Write-Host $ServiceCheck.Output

Write-Host ""
Write-Host "[3/3] Bridge loglari kontrol ediliyor..." -ForegroundColor Cyan
$Logs = Invoke-VpsCmd "sudo journalctl -u proton-bridge -n 20 --no-pager 2>&1 || sudo journalctl -u protonmail-bridge -n 20 --no-pager 2>&1 || journalctl | grep -i proton | tail -20"
Write-Host $Logs.Output

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

