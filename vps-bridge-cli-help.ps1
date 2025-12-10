$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI KOMUT FORMATI KONTROLU" -ForegroundColor Cyan
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

Write-Host "[1/3] Bridge CLI help komutunu kontrol ediyorum..." -ForegroundColor Cyan
$HelpResult = Invoke-VpsCmd "protonmail-bridge --cli --help 2>&1 | head -50"
Write-Host $HelpResult.Output -ForegroundColor White
Write-Host ""

Write-Host "[2/3] Accounts komutlarini kontrol ediyorum..." -ForegroundColor Cyan
$AccountsHelp = Invoke-VpsCmd "protonmail-bridge --cli accounts --help 2>&1 | head -30"
Write-Host $AccountsHelp.Output -ForegroundColor White
Write-Host ""

Write-Host "[3/3] Interaktif modda komut denemesi..." -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI interaktif modda calisiyor." -ForegroundColor Yellow
Write-Host "Dogru format: protonmail-bridge --cli ile baslatip, sonra komut yazilir" -ForegroundColor Yellow
Write-Host ""

# Non-interactive komut denemesi
$NonInteractive = Invoke-VpsCmd "echo 'accounts list' | timeout 5 protonmail-bridge --cli 2>&1 || echo 'Non-interactive test'"
Write-Host $NonInteractive.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DOGRU KULLANIM:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Bridge CLI'yi baslat:" -ForegroundColor White
Write-Host "   protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Interaktif modda komut yaz (>>> prompt'unda):" -ForegroundColor White
Write-Host "   >>> help" -ForegroundColor Gray
Write-Host "   >>> accounts list" -ForegroundColor Gray
Write-Host "   >>> info" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Cikis icin:" -ForegroundColor White
Write-Host "   >>> quit" -ForegroundColor Gray
Write-Host "   veya Ctrl+C" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null
