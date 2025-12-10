$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI INTERAKTIF MOD TESTI" -ForegroundColor Cyan
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
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/3] Bridge CLI help komutunu non-interactive modda calistiriyorum..." -ForegroundColor Cyan
$HelpCmd = "echo -e 'help\nquit' | timeout 15 protonmail-bridge --cli --noninteractive 2>&1 | grep -v 'WARN\\|Failed to add\\|keychain\\|Requested max\\|Welcome\\|^___\\|^__\\.\\|^_\\|^\\['\\|^!!\\|^\\^\\|^jgs\\|^~~\\|^\\s*$' | head -100"
$HelpResult = Invoke-VpsCmd $HelpCmd

Write-Host "HELP OUTPUT:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host $HelpResult.Output -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] Accounts komutunu test ediyorum..." -ForegroundColor Cyan
$AccountsTestCmd = "echo -e 'accounts\nquit' | timeout 15 protonmail-bridge --cli --noninteractive 2>&1 | grep -v 'WARN\\|Failed to add\\|keychain\\|Requested max\\|Welcome\\|^___\\|^__\\.\\|^_\\|^\\['\\|^!!\\|^\\^\\|^jgs\\|^~~\\|^\\s*$' | head -50"
$AccountsTest = Invoke-VpsCmd $AccountsTestCmd

Write-Host "ACCOUNTS OUTPUT:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host $AccountsTest.Output -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "[3/3] Info komutunu test ediyorum..." -ForegroundColor Cyan
$InfoTestCmd = "echo -e 'info\nquit' | timeout 15 protonmail-bridge --cli --noninteractive 2>&1 | grep -v 'WARN\\|Failed to add\\|keychain\\|Requested max\\|Welcome\\|^___\\|^__\\.\\|^_\\|^\\['\\|^!!\\|^\\^\\|^jgs\\|^~~\\|^\\s*$' | head -50"
$InfoTest = Invoke-VpsCmd $InfoTestCmd

Write-Host "INFO OUTPUT:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host $InfoTest.Output -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "VPS'te kullanabileceginiz komutlar:" -ForegroundColor White
Write-Host ""
Write-Host "1. Bridge CLI'yi baslat:" -ForegroundColor Cyan
Write-Host "   protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Interaktif modda komutlar (>>> prompt'unda):" -ForegroundColor Cyan
Write-Host "   >>> help" -ForegroundColor Gray
Write-Host "   >>> info" -ForegroundColor Gray
Write-Host "   >>> accounts" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Cikis:" -ForegroundColor Cyan
Write-Host "   >>> quit" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



