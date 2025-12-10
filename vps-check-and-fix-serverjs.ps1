$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVER.JS KONTROL VE DUZELTME" -ForegroundColor Cyan
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

Write-Host "[1/4] server.js dosya yolu kontrol ediliyor..." -ForegroundColor Cyan
$FileCheck = Invoke-VpsCmd @"
find /var/www -name "server.js" -type f 2>/dev/null | head -5
ls -lh /var/www/adulttube-backend/server/server.js 2>&1
"@
Write-Host $FileCheck.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/4] server.js dosyasi okunuyor (ilk 50 satir)..." -ForegroundColor Cyan
$ReadFile = Invoke-VpsCmd "head -50 /var/www/adulttube-backend/server/server.js 2>&1"
Write-Host $ReadFile.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/4] CORS ayarlari bulunuyor..." -ForegroundColor Cyan
$FindCORS = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
grep -n "allowedOrigins\|www.pornras.com" server.js | head -10
"@
Write-Host $FindCORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/4] CORS ayarlari guncelleniyor..." -ForegroundColor Cyan
$UpdateCORS = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
cp server.js server.js.bak

# api.pornras.com'u ekle (eğer yoksa)
if ! grep -q "api.pornras.com" server.js; then
    # 'https://www.pornras.com' satırını bulup altına ekle
    sed -i "/'https:\/\/www.pornras.com',/a\\  'https://api.pornras.com'," server.js
    echo 'api.pornras.com eklendi'
else
    echo 'api.pornras.com zaten var'
fi

echo '---'
grep -A 8 "allowedOrigins" server.js | head -10
"@
Write-Host $UpdateCORS.Output -ForegroundColor Gray
Write-Host ""

if ($UpdateCORS.Output -match "eklendi" -or $UpdateCORS.Output -match "zaten var" -or $UpdateCORS.Output -match "api.pornras.com") {
    Write-Host "[5/5] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
    $Restart = Invoke-VpsCmd "pm2 restart adulttube-backend && sleep 3 && pm2 list | grep adulttube-backend"
    Write-Host $Restart.Output -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "CORS ayarlari bulunamadi veya guncellenemedi!" -ForegroundColor Red
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


