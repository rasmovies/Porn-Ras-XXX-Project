$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE CLI DOGRU KOMUT FORMATI" -ForegroundColor Cyan
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
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 45
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ONEMLI: DOGRU KULLANIM FORMATI" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Bridge CLI interaktif modda calisir. Komut formatini anlamak icin:" -ForegroundColor White
Write-Host ""

Write-Host "[1] VPS'te Bridge CLI'yi baslat:" -ForegroundColor Cyan
Write-Host "   protonmail-bridge --cli" -ForegroundColor Gray
Write-Host ""

Write-Host "[2] >>> prompt'unda sadece komut adini yazin (TIRNAK ISARETI YOK!):" -ForegroundColor Cyan
Write-Host "   >>> help" -ForegroundColor Green
Write-Host "   >>> info" -ForegroundColor Green  
Write-Host "   >>> accounts" -ForegroundColor Green
Write-Host ""
Write-Host "   YANLIS: >>> protonmail-bridge --cli accounts list" -ForegroundColor Red
Write-Host "   DOGRU:  >>> accounts" -ForegroundColor Green
Write-Host ""

Write-Host "[3] 'accounts' komutundan sonra alt komutlar gelir:" -ForegroundColor Cyan
Write-Host "   >>> accounts" -ForegroundColor Green
Write-Host "   sonra: list" -ForegroundColor Green
Write-Host "   veya: info [email]" -ForegroundColor Green
Write-Host ""

Write-Host "[4] Cikis icin:" -ForegroundColor Cyan
Write-Host "   >>> quit" -ForegroundColor Green
Write-Host "   veya Ctrl+C" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ORNEK KULLANIM:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "$ protonmail-bridge --cli" -ForegroundColor White
Write-Host ">>> help" -ForegroundColor Green
Write-Host ">>> accounts" -ForegroundColor Green
Write-Host ">>> list" -ForegroundColor Green
Write-Host ">>> quit" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OTOMATIK TEST:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Test: help komutunu çalıştır
Write-Host "[TEST] Help komutu test ediliyor..." -ForegroundColor Cyan
$HelpTest = Invoke-VpsCmd "printf 'help\nquit\n' | timeout 20 protonmail-bridge --cli --noninteractive 2>&1 | tail -50"
Write-Host $HelpTest.Output -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OZET:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. protonmail-bridge --cli ile baslat" -ForegroundColor White
Write-Host "2. >>> prompt'unda sadece 'help', 'info', 'accounts' yaz" -ForegroundColor White
Write-Host "3. 'accounts' yazinca alt menude 'list' gibi komutlar cikar" -ForegroundColor White
Write-Host "4. Komutlarin onune 'protonmail-bridge --cli' YAZMA!" -ForegroundColor Red
Write-Host ""



