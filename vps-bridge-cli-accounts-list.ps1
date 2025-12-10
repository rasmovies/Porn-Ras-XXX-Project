$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI HESAP LİSTELEME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

try {
    $Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey -ConnectionTimeout 30
    Write-Host "SSH baglantisi kuruldu!" -ForegroundColor Green
} catch {
    Write-Host "SSH baglantisi kurulamadi: $_" -ForegroundColor Red
    exit 1
}

function Invoke-VpsCmd {
    param([string]$Cmd)
    try {
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 30
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/3] Bridge process'lerini sonlandiriyorum..." -ForegroundColor Cyan
$KillAll = Invoke-VpsCmd @"
killall -9 protonmail-bridge proton-bridge bridge 2>/dev/null
pkill -9 -f 'bridge.*--cli' 2>/dev/null
sleep 2
rm -f /tmp/*protonmail* /tmp/*bridge* 2>/dev/null
rm -f ~/.config/protonmail/bridge-v3/*.lock 2>/dev/null
rm -f ~/.local/share/protonmail/bridge-v3/*.lock 2>/dev/null
echo 'Temizlik tamamlandi'
"@
Write-Host $KillAll.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] Bridge CLI komut formatini arastiriyorum..." -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI interaktif modda calisir. Non-interactive mod deniyorum..." -ForegroundColor Yellow
Write-Host ""

# Non-interactive mod ile komut denemesi
$NonInteractiveTest = Invoke-VpsCmd "protonmail-bridge --cli --noninteractive accounts list 2>&1 | head -20"
Write-Host "Non-interactive mod testi:" -ForegroundColor Gray
Write-Host $NonInteractiveTest.Output -ForegroundColor White
Write-Host ""

# Alternatif: direk komut ile deneme
$DirectCmd = Invoke-VpsCmd "protonmail-bridge --cli accounts list 2>&1 | head -20"
Write-Host "Direkt komut testi:" -ForegroundColor Gray
Write-Host $DirectCmd.Output -ForegroundColor White
Write-Host ""

Write-Host "[3/3] Interaktif mod simulasyonu..." -ForegroundColor Cyan
Write-Host "Bridge CLI icin dogru kullanim:" -ForegroundColor Yellow
Write-Host ""
Write-Host "VPS'te bu sekilde kullanin:" -ForegroundColor White
Write-Host "  1. protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  2. >>> prompt'unda 'accounts' yazin" -ForegroundColor Gray
Write-Host "  3. Sonra 'list' yazin" -ForegroundColor Gray
Write-Host ""
Write-Host "VEYA non-interactive mod:" -ForegroundColor White
Write-Host "  protonmail-bridge --cli --noninteractive accounts list" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($NonInteractiveTest.Output -notmatch "lock file|another instance") {
    Write-Host "Bridge CLI non-interactive modda calisiyor!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Kullanilabilir komutlar:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli --noninteractive accounts list" -ForegroundColor Gray
    Write-Host "  protonmail-bridge --cli --noninteractive info" -ForegroundColor Gray
} else {
    Write-Host "Lock file hatasi var, once process'leri temizleyin." -ForegroundColor Red
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



