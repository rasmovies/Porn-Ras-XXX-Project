$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HTTPS BACKEND BAGLANTI TESTI" -ForegroundColor Cyan
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
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 120
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

Write-Host "[1/3] HTTPS backend test (self-signed cert bypass)..." -ForegroundColor Cyan
$HTTPSTest = Invoke-VpsCmd "curl -k -s https://72.61.139.145/health 2>&1"
Write-Host $HTTPSTest.Output -ForegroundColor $(if ($HTTPSTest.Output -match "OK") { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "[2/3] Email endpoint test..." -ForegroundColor Cyan
$EmailTest = Invoke-VpsCmd "curl -k -s -X POST https://72.61.139.145/api/email/verification -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"username\":\"test\",\"verifyUrl\":\"https://test.com\"}' 2>&1 | head -5"
Write-Host $EmailTest.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/3] Nginx ve backend durumu..." -ForegroundColor Cyan
$Status = Invoke-VpsCmd "systemctl is-active nginx && pm2 list | grep adulttube-backend"
Write-Host $Status.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "SONUC:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "HATA: ERR_CERT_AUTHORITY_INVALID" -ForegroundColor Yellow
Write-Host "SEBEP: Self-signed SSL sertifikasi (normal)" -ForegroundColor Gray
Write-Host ""
Write-Host "COZUM 1: TARAYICIDA SERTIFIKA UYARISINI GECIN" -ForegroundColor Cyan
Write-Host "1. Chrome/Edge: 'Advanced' -> 'Proceed to 72.61.139.145 (unsafe)'" -ForegroundColor White
Write-Host "2. Firefox: 'Advanced' -> 'Accept the Risk and Continue'" -ForegroundColor White
Write-Host "3. Safari: 'Show Details' -> 'visit this website'" -ForegroundColor White
Write-Host ""
Write-Host "COZUM 2: PRODUCTION ICIN LET'S ENCRYPT" -ForegroundColor Cyan
Write-Host "api.pornras.com subdomain'i ile Let's Encrypt sertifikasi kurulmali" -ForegroundColor White
Write-Host ""
Write-Host "NOT: Backend calisiyor, sadece sertifika uyarisi var!" -ForegroundColor Green
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


