$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVER.JS YUKLENIYOR (DIRECT)" -ForegroundColor Cyan
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

Write-Host "[1/4] server.js dosyasi okunuyor..." -ForegroundColor Cyan
$ServerJsPath = "server/server.js"
if (Test-Path $ServerJsPath) {
    $Content = Get-Content -Path $ServerJsPath -Raw -Encoding UTF8
    $Lines = $Content.Split("`n")
    Write-Host "Dosya okundu: $($Lines.Count) satir" -ForegroundColor Gray
    
    Write-Host "[2/4] Base64 encoding..." -ForegroundColor Cyan
    $Base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Content))
    Write-Host "Base64 hazir: $($Base64.Length) karakter" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "[3/4] VPS'e yukleniyor..." -ForegroundColor Cyan
    # Base64'ü parçalara böl (çok büyük olabilir)
    $ChunkSize = 5000
    $Chunks = @()
    for ($i = 0; $i -lt $Base64.Length; $i += $ChunkSize) {
        $Chunk = $Base64.Substring($i, [Math]::Min($ChunkSize, $Base64.Length - $i))
        $Chunks += $Chunk
    }
    
    # Yedek al
    $Backup = Invoke-VpsCmd "cd /var/www/adulttube-backend/server && cp server.js server.js.backup 2>/dev/null && echo 'Yedek alindi' || echo 'Yedek alinamadi'"
    Write-Host $Backup.Output -ForegroundColor Gray
    
    # Chunk'ları birleştir ve yükle
    $AllChunks = $Chunks -join ""
    $Upload = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
echo '$AllChunks' | base64 -d > server.js.new 2>&1
if [ -s server.js.new ] && [ `$(wc -c < server.js.new) -gt 1000 ]; then
    mv server.js.new server.js
    echo 'server.js guncellendi'
    echo 'Satir sayisi:' `$(wc -l < server.js)
    echo 'CORS ayarlari:'
    grep -A 8 'allowedOrigins' server.js | head -10
else
    echo 'HATA: server.js guncellenemedi veya dosya cok kucuk'
    cat server.js.new 2>&1 | head -5
    exit 1
fi
"@
    Write-Host $Upload.Output -ForegroundColor Gray
    Write-Host ""
    
    if ($Upload.Output -match "guncellendi") {
        Write-Host "[4/4] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
        $Restart = Invoke-VpsCmd "pm2 restart adulttube-backend && sleep 3 && pm2 logs adulttube-backend --lines 3 --nostream 2>&1 | tail -3"
        Write-Host $Restart.Output -ForegroundColor Gray
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "BASARILI!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "HATA: Dosya yuklenemedi!" -ForegroundColor Red
    }
} else {
    Write-Host "HATA: server/server.js bulunamadi!" -ForegroundColor Red
}

Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null
