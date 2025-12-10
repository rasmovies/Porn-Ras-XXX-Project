$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE PROCESS SONLANDIRMA VE BAŞLATMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

try {
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ConnectionTimeout 30
    Write-Host "✅ SSH bağlantısı kuruldu!" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH bağlantısı kurulamadı: $_" -ForegroundColor Red
    exit 1
}

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host ""
Write-Host "[1/4] Çalışan Bridge process'lerini buluyorum..." -ForegroundColor Cyan
$Processes = Invoke-VpsCmd "ps aux | grep -iE 'protonmail|bridge' | grep -v grep"
Write-Host $Processes.Output -ForegroundColor Gray

if ($Processes.Output -match '\d+') {
    Write-Host ""
    Write-Host "[2/4] Process'leri sonlandırıyorum..." -ForegroundColor Cyan
    
    # Tüm Bridge process'lerini bul ve öldür
    $KillScript = @"
ps aux | grep -iE 'protonmail|bridge' | grep -v grep | awk '{print \$2}' | xargs -r kill -9 2>/dev/null
killall -9 protonmail-bridge 2>/dev/null
killall -9 proton-bridge 2>/dev/null
killall -9 bridge 2>/dev/null
pkill -9 -f 'bridge.*--cli' 2>/dev/null
pkill -9 -f 'protonmail' 2>/dev/null
sleep 3
ps aux | grep -iE 'protonmail|bridge' | grep -v grep || echo 'TEMİZ'
"@
    
    $KillResult = Invoke-VpsCmd $KillScript
    Write-Host $KillResult.Output -ForegroundColor $(if ($KillResult.Output -match 'TEMİZ') { 'Green' } else { 'Red' })
    
    if (-not ($KillResult.Output -match 'TEMİZ')) {
        Write-Host "⚠️  Hala process'ler var, tekrar deniyorum..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        $KillAgain = Invoke-VpsCmd "killall -9 protonmail-bridge proton-bridge bridge 2>&1; sleep 2; echo 'Done'"
        Write-Host $KillAgain.Output -ForegroundColor Gray
    }
} else {
    Write-Host "Process bulunamadı" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/4] Lock file'ları temizliyorum..." -ForegroundColor Cyan
$CleanLocks = Invoke-VpsCmd @"
rm -f /tmp/*protonmail* /tmp/*bridge* 2>/dev/null
rm -f ~/.config/protonmail/bridge-v3/*.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/*.lock 2>/dev/null
find /tmp /var/lock /run ~/.config ~/.local -name '*protonmail*.lock' -delete 2>/dev/null
find /tmp /var/lock /run -name '*bridge*.lock' -delete 2>/dev/null
sleep 1
echo 'Locks cleaned'
"@
Write-Host $CleanLocks.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Bridge CLI'yi başlatıyorum..." -ForegroundColor Cyan
Write-Host ""

# Bridge CLI'yi başlat - help komutu ile test ediyoruz
$TestBridge = Invoke-VpsCmd "protonmail-bridge --cli --help 2>&1 | head -5"
Write-Host "Bridge CLI test:" -ForegroundColor Gray
Write-Host $TestBridge.Output -ForegroundColor White

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUÇ:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Lock file hatası kontrolü
if ($TestBridge.Output -match "lock file|another instance|already running") {
    Write-Host "❌ HALA LOCK FILE HATASI VAR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Bridge process'leri başka bir terminal session'ında çalışıyor olabilir." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ÇÖZÜM:" -ForegroundColor Cyan
    Write-Host "1. VPS'te tüm terminal session'larını kapatın" -ForegroundColor White
    Write-Host "2. Bridge servisini kontrol edin: sudo systemctl status protonmail-bridge" -ForegroundColor White
    Write-Host "3. Servis çalışıyorsa durdurun: sudo systemctl stop protonmail-bridge" -ForegroundColor White
    Write-Host "4. Yeni bir SSH bağlantısı açın ve tekrar deneyin" -ForegroundColor White
} else {
    Write-Host "✅ Bridge CLI çalışıyor!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Artık Bridge CLI komutlarını kullanabilirsiniz:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli login" -ForegroundColor Gray
    Write-Host "  protonmail-bridge --cli info" -ForegroundColor Gray
    Write-Host "  protonmail-bridge --cli accounts list" -ForegroundColor Gray
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



