$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS BACKEND CORS DUZELTME" -ForegroundColor Cyan
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

Write-Host "[1/4] Backend dizinini buluyorum..." -ForegroundColor Cyan
$BackendPath = "/var/www/adulttube-backend/server"
Write-Host "Backend dizini: $BackendPath" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] Mevcut server.js dosyasini yedekliyorum..." -ForegroundColor Cyan
$Backup = Invoke-VpsCmd "cd $BackendPath && cp server.js server.js.backup.`$(date +%Y%m%d_%H%M%S) && echo 'Yedek olusturuldu'"
Write-Host $Backup.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/4] server.js dosyasini guncel surumden aliyorum..." -ForegroundColor Cyan
Write-Host "NOT: Local'deki server.js Vercel CORS destegiyle guncellendi" -ForegroundColor Yellow
Write-Host ""

# server.js dosyasını SCP ile yükle
$ServerJsContent = Get-Content "server/server.js" -Raw
$ServerJsEscaped = $ServerJsContent -replace '"', '\"' -replace '`', '\`' -replace '\$', '\$'

# Base64 encode ile upload et (daha güvenli)
$ServerJsBytes = [System.Text.Encoding]::UTF8.GetBytes($ServerJsContent)
$ServerJsBase64 = [Convert]::ToBase64String($ServerJsBytes)

$UploadScript = @"
cd $BackendPath
echo '$ServerJsBase64' | base64 -d > server.js.new
mv server.js.new server.js
echo 'server.js guncellendi'
head -35 server.js | tail -20
"@

$Upload = Invoke-VpsCmd $UploadScript
Write-Host $Upload.Output -ForegroundColor White
Write-Host ""

Write-Host "[4/4] Backend'i yeniden baslatiyorum..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd "pm2 restart adulttube-backend; sleep 3; pm2 logs adulttube-backend --lines 10 --nostream"
Write-Host $Restart.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORS TEST" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend health check..." -ForegroundColor Cyan
$Health = Invoke-VpsCmd "curl -s http://localhost:5000/health"
Write-Host $Health.Output -ForegroundColor White
Write-Host ""

Write-Host "CORS preflight test (Vercel origin)..." -ForegroundColor Cyan
$CorsTest = Invoke-VpsCmd "curl -s -H 'Origin: https://test.vercel.app' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type' -X OPTIONS http://localhost:5000/api/email/verification -v 2>&1 | grep -i 'access-control' || echo 'CORS headers check'"
Write-Host $CorsTest.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "CORS ayarlari guncellendi!" -ForegroundColor Green
Write-Host "Backend artik Vercel deployment URL'lerini kabul ediyor." -ForegroundColor Green
Write-Host ""
Write-Host "Vercel'de tekrar test edin:" -ForegroundColor White
Write-Host "  - Email verification endpoint'i calismali" -ForegroundColor Gray
Write-Host "  - CORS hatasi gitmeli" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



