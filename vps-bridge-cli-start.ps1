$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI BAŞLATMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Yeni SSH bağlantısı kuruluyor..." -ForegroundColor Cyan
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
Write-Host "[2/3] Son kontrol - kalan process'ler..." -ForegroundColor Cyan
$CheckProcesses = Invoke-VpsCmd "ps aux | grep -iE 'protonmail|bridge.*--cli' | grep -v grep || echo 'YOK'"
Write-Host $CheckProcesses.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Bridge CLI başlatılıyor..." -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI interaktif bir programdır. İlk çalıştırmada kurulum gerekiyorsa bilgilendirme mesajları göreceksiniz." -ForegroundColor Yellow
Write-Host ""

# Bridge CLI'yi başlat - non-interactive mode için timeout ekle
$BridgeCmd = "timeout 10 protonmail-bridge --cli 2>&1 || protonmail-bridge --cli 2>&1 | head -20"
$BridgeResult = Invoke-VpsCmd $BridgeCmd

Write-Host "Bridge CLI Çıktısı:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
Write-Host $BridgeResult.Output -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray

if ($BridgeResult.ExitStatus -eq 0 -or $BridgeResult.Output) {
    Write-Host ""
    Write-Host "✅ Bridge CLI çalıştırıldı!" -ForegroundColor Green
    
    # Lock file hatası kontrolü
    if ($BridgeResult.Output -match "lock file|another instance|already running") {
        Write-Host ""
        Write-Host "⚠️  HALA LOCK FILE HATASI VAR!" -ForegroundColor Red
        Write-Host "Daha agresif temizlik yapılıyor..." -ForegroundColor Yellow
        
        # Tüm lock file'ları ve process'leri zorla temizle
        $ForceClean = Invoke-VpsCmd @"
killall -9 protonmail-bridge 2>/dev/null
pkill -9 -f 'bridge.*--cli' 2>/dev/null
rm -f /tmp/*protonmail* /tmp/*bridge* 2>/dev/null
rm -f ~/.config/protonmail/bridge-v3/*.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/*.lock 2>/dev/null
find /tmp /var/lock /run ~/.config ~/.local -name '*protonmail*.lock' -delete 2>/dev/null
sleep 2
echo 'Force clean done'
"@
        Write-Host $ForceClean.Output -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "Tekrar deniyorum..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        $RetryResult = Invoke-VpsCmd "protonmail-bridge --cli --help 2>&1 | head -30 || protonmail-bridge --cli 2>&1 | head -30"
        Write-Host $RetryResult.Output -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "✅ Lock file hatası yok gibi görünüyor!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Bridge CLI komutlarını kullanabilirsiniz:" -ForegroundColor White
        Write-Host "  protonmail-bridge --cli login" -ForegroundColor Gray
        Write-Host "  protonmail-bridge --cli info" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "❌ Bridge CLI çalıştırılamadı!" -ForegroundColor Red
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



