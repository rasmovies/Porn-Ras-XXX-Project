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
Write-Host "BRIDGE CONFIG DETAYLI KONTROL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Bridge config dosyası var mı?" -ForegroundColor Cyan
$ConfigExists = Invoke-VpsCmd "test -f ~/.config/protonmail/bridge-v3/keychain.json && echo 'EXISTS' || echo 'NOT FOUND'"
Write-Host "Config: $($ConfigExists.Output.Trim())" -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Bridge config dosyası içeriği (JSON format):" -ForegroundColor Cyan
$ConfigContent = Invoke-VpsCmd "cat ~/.config/protonmail/bridge-v3/keychain.json 2>/dev/null"
if ($ConfigContent.Output) {
    Write-Host $ConfigContent.Output -ForegroundColor Gray
} else {
    Write-Host "Config dosyası okunamadı veya boş" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/5] Bridge data klasörü içeriği:" -ForegroundColor Cyan
$DataDir = Invoke-VpsCmd "ls -la ~/.local/share/protonmail/bridge-v3/ 2>/dev/null | head -20"
Write-Host $DataDir.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Bridge loglari (tüm account mesajları):" -ForegroundColor Cyan
$AllAccountLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge --no-pager | grep -i -E 'account|pornras|added|sync|login|auth' | tail -30"
Write-Host $AllAccountLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] Bridge SMTP port kontrol:" -ForegroundColor Cyan
$PortCheck = Invoke-VpsCmd "netstat -tlnp | grep 1025 || ss -tlnp | grep 1025"
Write-Host $PortCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ONERILER:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "VPS'e SSH ile bağlanıp şu komutları MANUEL çalıştırın:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Bridge CLI'yi başlat:" -ForegroundColor White
Write-Host "   protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Account listesini gör:" -ForegroundColor White
Write-Host "   account list" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Account password'unu kontrol et:" -ForegroundColor White
Write-Host "   account password pornras" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Eğer account yoksa veya sorunluysa, yeniden ekle:" -ForegroundColor White
Write-Host "   account delete pornras" -ForegroundColor Gray
Write-Host "   account add" -ForegroundColor Gray
Write-Host "   (email: pornras@proton.me)" -ForegroundColor Gray
Write-Host "   (Proton Mail account password'unu gir)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Bridge'i yeniden başlat:" -ForegroundColor White
Write-Host "   sudo systemctl restart protonmail-bridge" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Sync mesajlarını kontrol et:" -ForegroundColor White
Write-Host "   sudo journalctl -u protonmail-bridge -f" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




