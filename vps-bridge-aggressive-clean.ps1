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
Write-Host "BRIDGE AGGRESIF TEMIZLIK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Tüm Bridge ile ilgili process'leri buluyorum..." -ForegroundColor Cyan
$AllBridgeProcesses = Invoke-VpsCmd "ps aux | grep -iE 'protonmail|bridge' | grep -v grep"
Write-Host $AllBridgeProcesses.Output -ForegroundColor Gray

if ($AllBridgeProcesses.Output) {
    Write-Host ""
    Write-Host "[2/6] Process'leri PID ile sonlandırıyorum..." -ForegroundColor Cyan
    $Pids = ($AllBridgeProcesses.Output -split "`n" | ForEach-Object { if ($_ -match '\d+') { ($_ -split '\s+')[1] } } | Where-Object { $_ -match '^\d+$' }) -join ' '
    if ($Pids) {
        $KillPids = Invoke-VpsCmd "kill -9 $Pids 2>&1; sleep 2; echo 'Processes killed'"
        Write-Host $KillPids.Output -ForegroundColor Gray
    }
} else {
    Write-Host "Process bulunamadı" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/6] Killall komutlarıyla son temizlik..." -ForegroundColor Cyan
$KillAll = Invoke-VpsCmd "killall -9 protonmail-bridge 2>&1; killall -9 proton-bridge 2>&1; killall -9 bridge 2>&1; pkill -9 -f protonmail 2>&1; sleep 2; echo 'Killall completed'"
Write-Host $KillAll.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/6] Bridge servisini durduruyorum..." -ForegroundColor Cyan
Invoke-VpsCmd "sudo systemctl stop protonmail-bridge 2>&1; sudo systemctl disable protonmail-bridge 2>&1" | Out-Null
Start-Sleep -Seconds 2
Invoke-VpsCmd "sudo systemctl enable protonmail-bridge 2>&1" | Out-Null
Write-Host "Servis durduruldu" -ForegroundColor Gray

Write-Host ""
Write-Host "[5/6] Tüm lock file ve socket'leri temizliyorum..." -ForegroundColor Cyan
$DeepClean = Invoke-VpsCmd @"
# Tüm protonmail/bridge ile ilgili dosyaları bul ve sil
rm -rf /tmp/.protonmail* 2>/dev/null
rm -rf /tmp/protonmail* 2>/dev/null
rm -rf /tmp/*bridge* 2>/dev/null
rm -rf /var/lock/protonmail* 2>/dev/null
rm -rf /run/protonmail* 2>/dev/null
rm -rf /run/*bridge* 2>/dev/null
rm -f ~/.config/protonmail/bridge-v3/*.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/*.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/updates/*/bridge*.lock 2>/dev/null

# Lock dosyalarını özel arayalım
find ~/.config/protonmail ~/.local/share/protonmail -type f -name '*lock*' -delete 2>/dev/null
find /tmp /var/lock /run -type f -name '*protonmail*' -delete 2>/dev/null
find /tmp /var/lock /run -type f -name '*bridge*.lock' -delete 2>/dev/null

echo 'Deep clean completed'
"@
Write-Host $DeepClean.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[6/6] Final kontrol..." -ForegroundColor Cyan
$FinalProcesses = Invoke-VpsCmd "ps aux | grep -iE 'protonmail|bridge.*--cli' | grep -v grep || echo 'TEMİZ'"
Write-Host $FinalProcesses.Output -ForegroundColor $(if ($FinalProcesses.Output -match 'TEMİZ') { 'Green' } else { 'Red' })

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUÇ:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($FinalProcesses.Output -match 'TEMİZ') {
    Write-Host "✅ Tüm Bridge process'leri sonlandırıldı!" -ForegroundColor Green
    Write-Host "✅ Lock file'lar temizlendi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "ŞİMDİ YAPMANIZ GEREKENLER:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. VPS'teki MEVCUT SSH terminal'ini TAMAMEN KAPATIN" -ForegroundColor Yellow
    Write-Host "2. YENİ bir SSH bağlantısı açın:" -ForegroundColor Yellow
    Write-Host "   ssh root@72.61.139.145" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Yeni terminal'de Bridge CLI'yi çalıştırın:" -ForegroundColor Yellow
    Write-Host "   protonmail-bridge --cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "NOT: Lock file hatası VPS'teki terminal session'ından kaynaklanıyor olabilir." -ForegroundColor Yellow
    Write-Host "     Yeni bir terminal açmak sorunu çözebilir." -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Hala process'ler çalışıyor!" -ForegroundColor Red
    Write-Host "VPS'te şu komutları manuel çalıştırın:" -ForegroundColor Yellow
    Write-Host "  ps aux | grep bridge | grep -v grep" -ForegroundColor Gray
    Write-Host "  kill -9 [PID]" -ForegroundColor Gray
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




