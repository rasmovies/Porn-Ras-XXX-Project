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
Write-Host "BRIDGE FINAL CLEANUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tüm Bridge process'lerini bul ve sonlandır
Write-Host "[1/4] Tüm Bridge process'lerini sonlandırıyorum..." -ForegroundColor Cyan
$KillScript = @"
pkill -9 protonmail-bridge 2>/dev/null
pkill -9 proton-bridge 2>/dev/null
pkill -9 -f 'bridge.*--cli' 2>/dev/null
ps aux | grep -E 'protonmail|bridge' | grep -v grep | awk '{print \$2}' | xargs -r kill -9 2>/dev/null
sleep 2
ps aux | grep -E 'protonmail|bridge' | grep -v grep || echo 'TEMIZ'
"@

$KillResult = Invoke-VpsCmd $KillScript
Write-Host $KillResult.Output -ForegroundColor Gray

# Servis durdur
Write-Host ""
Write-Host "[2/4] Bridge servisini durduruyorum..." -ForegroundColor Cyan
Invoke-VpsCmd "sudo systemctl stop protonmail-bridge 2>&1" | Out-Null

# Lock file'ları bul ve sil
Write-Host ""
Write-Host "[3/4] Lock file'ları bulup siliyorum..." -ForegroundColor Cyan
$CleanupScript = @"
# Bridge lock file'ları
rm -f /tmp/.protonmail-bridge*.lock 2>/dev/null
rm -f /tmp/protonmail-bridge*.lock 2>/dev/null
rm -f /tmp/*bridge*.lock 2>/dev/null
rm -f /var/lock/protonmail-bridge* 2>/dev/null
rm -f /run/protonmail-bridge* 2>/dev/null
rm -f ~/.config/protonmail/bridge-v3/.lock 2>/dev/null
rm -f ~/.config/protonmail/bridge-v3/*.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/*.lock 2>/dev/null

# Socket dosyaları
rm -f /tmp/*protonmail*.sock 2>/dev/null
rm -f /tmp/*bridge*.sock 2>/dev/null
rm -f /run/*protonmail*.sock 2>/dev/null

# PID dosyaları
rm -f /tmp/*protonmail*.pid 2>/dev/null
rm -f /var/run/protonmail-bridge*.pid 2>/dev/null

echo 'Cleanup completed'
"@

$CleanupResult = Invoke-VpsCmd $CleanupScript
Write-Host $CleanupResult.Output -ForegroundColor Gray

# Final kontrol
Write-Host ""
Write-Host "[4/4] Final kontrol..." -ForegroundColor Cyan
$FinalCheck = Invoke-VpsCmd "ps aux | grep -E 'protonmail|bridge.*--cli' | grep -v grep || echo 'TEMIZ'"
Write-Host $FinalCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUÇ:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($FinalCheck.Output -match 'TEMIZ') {
    Write-Host "✅ Tüm Bridge process'leri sonlandırıldı!" -ForegroundColor Green
    Write-Host "✅ Lock file'lar temizlendi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Şimdi VPS'te YENİ bir terminal açıp şunu çalıştırın:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ÖNEMLİ: Eğer hala lock file hatası alırsanız:" -ForegroundColor Yellow
    Write-Host "  1. VPS'te mevcut terminal'i KAPATIN" -ForegroundColor Gray
    Write-Host "  2. YENİ bir terminal açın" -ForegroundColor Gray
    Write-Host "  3. Tekrar deneyin: protonmail-bridge --cli" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Hala process'ler çalışıyor olabilir" -ForegroundColor Red
    Write-Host ""
    Write-Host "VPS'te manuel kontrol:" -ForegroundColor Yellow
    Write-Host "  ps aux | grep bridge" -ForegroundColor Gray
    Write-Host "  kill -9 [PID]" -ForegroundColor Gray
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




