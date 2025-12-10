$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORS AYARLARI GUNCELLENIYOR (DIRECT)" -ForegroundColor Cyan
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

Write-Host "[1/3] Mevcut CORS ayarlari kontrol ediliyor..." -ForegroundColor Cyan
$CurrentCORS = Invoke-VpsCmd "grep -A 10 'allowedOrigins' /var/www/adulttube-backend/server/server.js | head -12"
Write-Host $CurrentCORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] CORS ayarlari guncelleniyor..." -ForegroundColor Cyan
$UpdateCORS = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
cp server.js server.js.backup_cors

# api.pornras.com'u allowedOrigins listesine ekle
sed -i "/const allowedOrigins = \[/,/];/ {
    s|'https://www.pornras.com',|'https://www.pornras.com',\n  'https://api.pornras.com',|g
    s|'https://www.pornras.com',|'https://www.pornras.com',\n  'https://api.pornras.com', // Backend API domain|g
}" server.js

# Eğer zaten yoksa, satır sonuna ekle
if ! grep -q "api.pornras.com" server.js; then
    sed -i "/'https:\/\/www.pornras.com',/a\  'https://api.pornras.com', // Backend API domain" server.js
fi

echo 'CORS guncellendi'
echo '---'
grep -A 10 'allowedOrigins' server.js | head -12
"@
Write-Host $UpdateCORS.Output -ForegroundColor Gray
Write-Host ""

if ($UpdateCORS.Output -match "api.pornras.com" -or $UpdateCORS.Output -match "guncellendi") {
    Write-Host "[3/3] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
    $Restart = Invoke-VpsCmd "pm2 restart adulttube-backend && sleep 3 && pm2 status | grep adulttube-backend"
    Write-Host $Restart.Output -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "CORS ayarlari guncellendi!" -ForegroundColor Green
    Write-Host "api.pornras.com artik allowed origins listesinde!" -ForegroundColor Green
} else {
    Write-Host "CORS ayarlari guncellenirken sorun olustu!" -ForegroundColor Red
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


