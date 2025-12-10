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

Write-Host "Email hata detaylari kontrol ediliyor..." -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Backend error loglari:" -ForegroundColor Yellow
$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 20 --nostream 2>&1"
Write-Host $ErrorLogs.Output -ForegroundColor Red

Write-Host ""
Write-Host "[2/4] SMTP Baglanti Testi:" -ForegroundColor Cyan
$SmtpTest = Invoke-VpsCmd "nc -zv 127.0.0.1 1025 2>&1 || telnet 127.0.0.1 1025 <<< 'quit' 2>&1 || echo 'Baglanti test edilemedi'"
Write-Host $SmtpTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Bridge SMTP Loglari:" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 30 --no-pager | grep -i smtp"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] .env Dosyasi Tam Icerik:" -ForegroundColor Cyan
$EnvFull = Invoke-VpsCmd "cd $BackendPath && cat .env"
Write-Host $EnvFull.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

