$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE HIZLI KONTROL" -ForegroundColor Cyan
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
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 60
        return $Result
    } catch {
        return @{ Output = "TIMEOUT veya HATA: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/2] Bridge process kontrolu..." -ForegroundColor Cyan
$ProcessCheck = Invoke-VpsCmd "ps aux | grep -iE 'protonmail|bridge' | grep -v grep | head -3 || echo 'Process yok'"
Write-Host $ProcessCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/2] Bridge CLI test (timeout: 10 saniye)..." -ForegroundColor Cyan
$BridgeTest = Invoke-VpsCmd "timeout 10 protonmail-bridge --cli --help 2>&1 | head -10 || echo 'Timeout oldu ama Bridge calisiyor olabilir'"
Write-Host $BridgeTest.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($BridgeTest.Output -match "lock file|another instance") {
    Write-Host "HALA LOCK FILE HATASI VAR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "VPS'te bu komutlari manuel calistirin:" -ForegroundColor Yellow
    Write-Host "  ps aux | grep bridge | grep -v grep" -ForegroundColor Gray
    Write-Host "  kill -9 [PID]" -ForegroundColor Gray
    Write-Host "  rm -f /tmp/*protonmail* /tmp/*bridge*" -ForegroundColor Gray
    Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
} elseif ($BridgeTest.Output -match "USAGE:|COMMANDS:") {
    Write-Host "Bridge CLI calisiyor!" -ForegroundColor Green
    Write-Host ""
    Write-Host "VPS'te bu komutlari kullanabilirsiniz:" -ForegroundColor White
    Write-Host "  protonmail-bridge --cli accounts list" -ForegroundColor Gray
    Write-Host "  protonmail-bridge --cli info" -ForegroundColor Gray
} else {
    Write-Host "Bridge CLI durumu belirsiz. VPS'te manuel kontrol yapin." -ForegroundColor Yellow
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



