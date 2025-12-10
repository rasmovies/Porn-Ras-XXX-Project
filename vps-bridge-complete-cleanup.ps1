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
Write-Host "BRIDGE TAM TEMIZLIK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Tüm Bridge process'lerini sonlandırıyorum..." -ForegroundColor Cyan
$KillScript = @"
# Tüm Bridge process'lerini bul ve öldür
ps aux | grep -E 'protonmail-bridge|proton-bridge|bridge.*--cli' | grep -v grep | awk '{print \$2}' | xargs -r kill -9 2>/dev/null
killall -9 protonmail-bridge 2>/dev/null
killall -9 proton-bridge 2>/dev/null
pkill -9 -f 'bridge.*--cli' 2>/dev/null
pkill -9 -f 'protonmail' 2>/dev/null
sleep 3
echo 'Process cleanup completed'
"@

$KillResult = Invoke-VpsCmd $KillScript
Write-Host $KillResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Bridge servisini durduruyorum..." -ForegroundColor Cyan
$StopService = Invoke-VpsCmd "sudo systemctl stop protonmail-bridge 2>&1 && sleep 2 && echo 'Service stopped'"
Write-Host $StopService.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] Lock file'ları bulup siliyorum..." -ForegroundColor Cyan
$CleanupScript = @"
# Tüm lock file'ları bul ve sil
find /tmp -name '*protonmail*' -type f -delete 2>/dev/null
find /tmp -name '*bridge*' -type f -delete 2>/dev/null
find /var/lock -name '*protonmail*' -type f -delete 2>/dev/null
find /run -name '*protonmail*' -type f -delete 2>/dev/null
find ~/.config/protonmail -name '*.lock' -type f -delete 2>/dev/null
find ~/.local/share/protonmail -name '*.lock' -type f -delete 2>/dev/null

# Socket dosyaları
find /tmp -name '*protonmail*.sock' -delete 2>/dev/null
find /run -name '*protonmail*.sock' -delete 2>/dev/null

# PID dosyaları
rm -f /tmp/*protonmail*.pid 2>/dev/null
rm -f /var/run/protonmail-bridge*.pid 2>/dev/null
rm -f /run/protonmail-bridge*.pid 2>/dev/null

echo 'Lock files cleaned'
"@

$CleanupResult = Invoke-VpsCmd $CleanupScript
Write-Host $CleanupResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Kalan process'leri kontrol ediyorum..." -ForegroundColor Cyan
$Remaining = Invoke-VpsCmd "ps aux | grep -E 'protonmail|bridge' | grep -v grep || echo 'TÜM PROCESS'LER TEMİZ!'"
Write-Host $Remaining.Output -ForegroundColor $(if ($Remaining.Output -match 'TEMİZ') { 'Green' } else { 'Red' })

Write-Host ""
Write-Host "[5/5] Lock file kontrolü..." -ForegroundColor Cyan
$LockCheck = Invoke-VpsCmd "find /tmp /var/lock /run ~/.config/protonmail ~/.local/share/protonmail -name '*lock*' -o -name '*protonmail*' 2>/dev/null | head -10 || echo 'Lock file bulunamadı'"
Write-Host $LockCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUÇ:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($Remaining.Output -match 'TEMİZ') {
    Write-Host "✅ Tüm Bridge process'leri sonlandırıldı!" -ForegroundColor Green
    Write-Host "✅ Lock file'lar temizlendi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Şimdi VPS'te YENİ bir terminal açıp şunu çalıştırabilirsiniz:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ÖNEMLİ:" -ForegroundColor Yellow
    Write-Host "  1. Mevcut SSH terminal'ini KAPATIN" -ForegroundColor Gray
    Write-Host "  2. YENİ bir SSH bağlantısı açın" -ForegroundColor Gray
    Write-Host "  3. Bridge CLI'yi çalıştırın: protonmail-bridge --cli" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Hala process'ler çalışıyor olabilir" -ForegroundColor Red
    Write-Host ""
    Write-Host "VPS'te manuel olarak şu komutları çalıştırın:" -ForegroundColor Yellow
    Write-Host "  ps aux | grep bridge" -ForegroundColor Gray
    Write-Host "  kill -9 [PID]" -ForegroundColor Gray
    Write-Host "  sudo systemctl stop protonmail-bridge" -ForegroundColor Gray
    Write-Host "  rm -f /tmp/*protonmail* /tmp/*bridge*" -ForegroundColor Gray
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




