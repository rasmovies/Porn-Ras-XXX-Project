$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"
$LocalFile = "C:\Users\User\Desktop\adulttube\server\server.js"
$RemoteFile = "$BackendPath/server.js"

Import-Module Posh-SSH -Force

Write-Host "[1/5] VPS'e baglaniyor..." -ForegroundColor Cyan
$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)

# SSH session oluştur
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey
if (-not $Session) {
    Write-Host "HATA: VPS'e baglanilamadi!" -ForegroundColor Red
    exit 1
}

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "[2/5] Eski dosya yedekleniyor..." -ForegroundColor Cyan
$Timestamp = Get-Date -Format "yyyyMMddHHmmss"
Invoke-VpsCmd "cd $BackendPath && cp server.js server.js.backup.$Timestamp 2>&1" | Out-Null

Write-Host "[3/5] Dosya SCP ile yukleniyor..." -ForegroundColor Cyan
try {
    # SCP ile dosya yükle
    Set-SCPFile -ComputerName $VpsIp -Credential $Credential -LocalFile $LocalFile -RemotePath $BackendPath -AcceptKey
    Write-Host "OK: Dosya yuklendi" -ForegroundColor Green
} catch {
    Write-Host "SCP hatasi, alternatif yontem deneniyor..." -ForegroundColor Yellow
    
    # Alternatif: Dosyayı oku ve base64 ile gönder
    $FileContent = Get-Content $LocalFile -Raw -Encoding UTF8
    $FileBytes = [System.Text.Encoding]::UTF8.GetBytes($FileContent)
    $Base64Content = [Convert]::ToBase64String($FileBytes)
    
    # Base64 içeriğini parçalara böl ve VPS'e gönder
    $ChunkSize = 4000
    $Chunks = @()
    for ($i = 0; $i -lt $Base64Content.Length; $i += $ChunkSize) {
        if (($i + $ChunkSize) -lt $Base64Content.Length) {
            $Chunks += $Base64Content.Substring($i, $ChunkSize)
        } else {
            $Chunks += $Base64Content.Substring($i)
        }
    }
    
    Write-Host "Base64 parcalar yukleniyor ($($Chunks.Count) parca)..." -ForegroundColor Gray
    Invoke-VpsCmd "cd $BackendPath && rm -f server.js.tmp && touch server.js.tmp" | Out-Null
    
    foreach ($Chunk in $Chunks) {
        $ChunkEscaped = $Chunk -replace "'", "'\''"
        Invoke-VpsCmd "cd $BackendPath && echo '$ChunkEscaped' >> server.js.tmp" | Out-Null
    }
    
    # Base64'ü decode et
    Invoke-VpsCmd "cd $BackendPath && base64 -d server.js.tmp > server.js && rm server.js.tmp && chmod 644 server.js" | Out-Null
    Write-Host "OK: Dosya alternatif yontemle yuklendi" -ForegroundColor Green
}

Write-Host "[4/5] Dosya dogrulaniyor..." -ForegroundColor Cyan
$Verify = Invoke-VpsCmd "cd $BackendPath && head -5 server.js && echo '---' && tail -5 server.js && echo '---' && wc -l server.js"
Write-Host $Verify.Output -ForegroundColor Gray

# Syntax kontrolü
$SyntaxCheck = Invoke-VpsCmd "cd $BackendPath && node -c server.js 2>&1"
if ($SyntaxCheck.ExitStatus -eq 0) {
    Write-Host "OK: Syntax dogru!" -ForegroundColor Green
} else {
    Write-Host "HATA: Syntax hatasi var!" -ForegroundColor Red
    Write-Host $SyntaxCheck.Output -ForegroundColor Red
    Remove-SSHSession -SessionId $Session.SessionId | Out-Null
    exit 1
}

Write-Host "[5/5] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete adulttube-backend 2>&1" | Out-Null
Start-Sleep -Seconds 2

$StartResult = Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend --update-env"
Write-Host $StartResult.Output -ForegroundColor Gray

Start-Sleep -Seconds 5

$Status = Invoke-VpsCmd "pm2 status"
Write-Host ""
Write-Host "PM2 Status:" -ForegroundColor Cyan
Write-Host $Status.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 10 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ISLEM TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

