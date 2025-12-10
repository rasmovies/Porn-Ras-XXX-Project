$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

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
Write-Host "BRIDGE SMTP BILGILERINI ALMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Bridge loglari (SMTP ayarlari):" -ForegroundColor Cyan
Write-Host "NOT: Bridge başlatıldığında SMTP ayarlarını loglara yazıyor olabilir" -ForegroundColor Yellow
$SmtpLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge --no-pager | grep -i -E 'smtp|1025|imap|1143|username|password|configuration' | tail -30"
Write-Host $SmtpLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] Bridge config dosyalari kontrol:" -ForegroundColor Cyan
$ConfigCheck = Invoke-VpsCmd "find ~/.config/protonmail ~/.local/share/protonmail -type f -name '*.json' 2>/dev/null | head -10"
Write-Host $ConfigCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Bridge CLI komut syntax'i:" -ForegroundColor Cyan
Write-Host "Bridge CLI'de şu komutları deneyin:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Help komutları:" -ForegroundColor White
Write-Host "   help" -ForegroundColor Gray
Write-Host "   account help" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Account bilgileri:" -ForegroundColor White
Write-Host "   account list" -ForegroundColor Gray
Write-Host "   account info pornras" -ForegroundColor Gray
Write-Host "   account show pornras" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Alternatif password komutları:" -ForegroundColor White
Write-Host "   account smtp-password pornras" -ForegroundColor Gray
Write-Host "   account credentials pornras" -ForegroundColor Gray
Write-Host "   account config pornras" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "EN KOLAY YOL:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Eğer Bridge GUI varsa:" -ForegroundColor Green
Write-Host "  1. Bridge GUI'yi açın" -ForegroundColor Gray
Write-Host "  2. Settings > Advanced > Bridge > SMTP bölümüne gidin" -ForegroundColor Gray
Write-Host "  3. SMTP Password'u gösterin ve kopyalayın" -ForegroundColor Gray
Write-Host ""
Write-Host "GUI yoksa, Bridge CLI'de 'help' komutunu çalıştırıp" -ForegroundColor Yellow
Write-Host "doğru komut syntax'ını bulun." -ForegroundColor Yellow
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




