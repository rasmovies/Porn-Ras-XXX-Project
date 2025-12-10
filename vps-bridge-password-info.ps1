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
Write-Host "BRIDGE PASSWORD ARAS TIRMASI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proton Mail Bridge'de iki farkli password var:" -ForegroundColor Yellow
Write-Host "1. Proton Mail Account Password (email giris sifresi)" -ForegroundColor Gray
Write-Host "2. Bridge SMTP/IMAP Password (Bridge tarafindan uretilen ozel sifre)" -ForegroundColor Gray
Write-Host ""
Write-Host "SMTP icin Bridge'in urettigi ozel password kullanilmali!" -ForegroundColor Green
Write-Host ""

Write-Host "[1/5] Bridge config dosyalari kontrol:" -ForegroundColor Cyan
$ConfigCheck = Invoke-VpsCmd "find ~/.config -name '*bridge*' -type d 2>/dev/null | head -5"
Write-Host $ConfigCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Bridge data klasoru kontrol:" -ForegroundColor Cyan
$DataCheck = Invoke-VpsCmd "ls -la ~/.local/share/protonmail/bridge* 2>/dev/null | head -10 || echo 'Data klasoru bulunamadi'"
Write-Host $DataCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] Bridge loglari (password bilgileri):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 500 --no-pager | grep -i -E 'password|smtp|auth|credential|user' | tail -20"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Bridge CLI kullanim:" -ForegroundColor Cyan
Write-Host "Bridge CLI interaktif oldugu icin otomatik calistirilamiyor" -ForegroundColor Yellow
Write-Host "VPS'te manuel olarak calistirin:" -ForegroundColor Yellow
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  veya" -ForegroundColor Gray
Write-Host "  /usr/bin/protonmail-bridge --cli" -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] Mevcut .env dosyasindaki password:" -ForegroundColor Cyan
$EnvPwd = Invoke-VpsCmd "cd $BackendPath && cat .env | grep PROTON_SMTP_PASSWORD"
Write-Host $EnvPwd.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ONEMLI BILGI:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Bridge SMTP password'u Bridge tarafindan uretilir" -ForegroundColor Gray
Write-Host "Bu password Bridge GUI'den alinabilir:" -ForegroundColor Gray
Write-Host "  Settings > Advanced > Bridge > SMTP" -ForegroundColor Gray
Write-Host ""
Write-Host "Veya Bridge CLI'den:" -ForegroundColor Gray
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  sonra 'account list' ve 'account password <account>' komutlari" -ForegroundColor Gray
Write-Host ""
Write-Host "Normal Proton Mail sifresi DEGIL, Bridge'in urettigi ozel sifre kullanilmali!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Yellow

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

