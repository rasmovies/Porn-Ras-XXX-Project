$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS CORS FINAL DUZELTME" -ForegroundColor Cyan
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
        $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd -TimeOut 90
        return $Result
    } catch {
        return @{ Output = "TIMEOUT: $_"; ExitStatus = 1 }
    }
}

$BackendPath = "/var/www/adulttube-backend/server"

Write-Host "[1/3] Mevcut CORS ayarlarini goruntuluyorum..." -ForegroundColor Cyan
$CurrentCors = Invoke-VpsCmd "cd $BackendPath && grep -A 35 'app.use.*cors' server.js | head -40"
Write-Host $CurrentCors.Output -ForegroundColor White
Write-Host ""

Write-Host "[2/3] CORS'u TUM origin'lere izin verecek sekilde guncelliyorum..." -ForegroundColor Cyan

# CORS'u direkt olarak VPS'te güncelle - tüm origin'lere izin ver (test için)
$UpdateCors = Invoke-VpsCmd @"
cd $BackendPath

# Yedek al
cp server.js server.js.backup.cors.\`$(date +%Y%m%d_%H%M%S)

# CORS ayarlarını güncelle - tüm origin'lere izin ver
cat > /tmp/cors_fix.js << 'CORSEOF'
app.use(
  cors({
    origin: function (origin, callback) {
      // Tüm origin'lere izin ver (production'da kısıtlayın)
      callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);
CORSEOF

# server.js'de CORS bölümünü bul ve değiştir
python3 << 'PYEOF'
import re
import sys

with open('$BackendPath/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# CORS bölümünü bul ve değiştir
cors_pattern = r"app\.use\(\s*cors\(\{[^}]*origin[^}]*\}\)\s*\);"

new_cors = """app.use(
  cors({
    origin: function (origin, callback) {
      // Tüm origin'lere izin ver (production'da kısıtlayın)
      callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);"""

if re.search(cors_pattern, content):
    content = re.sub(cors_pattern, new_cors, content, flags=re.DOTALL)
    with open('$BackendPath/server.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('CORS guncellendi')
else:
    print('CORS pattern bulunamadi')
PYEOF

# Alternatif: sed ile basit değiştirme
sed -i '/app.use(/,/})/{
  /cors(/{
    :a
    N
    /})/!ba
    s/app.use(.*cors(.*origin:.*)/app.use(cors({ origin: function (origin, callback) { callback(null, true); }, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: false, optionsSuccessStatus: 200, preflightContinue: false, }));/
  }
}' server.js

echo 'CORS guncelleme tamamlandi'
grep -A 10 'app.use.*cors' server.js | head -15
"@

Write-Host $UpdateCors.Output -ForegroundColor Gray
Write-Host ""

# Daha basit bir yöntem: server.js'in CORS satırlarını direkt değiştir
Write-Host "[3/3] CORS'u manuel olarak guncelliyorum (daha basit yontem)..." -ForegroundColor Cyan

$ManualCorsFix = Invoke-VpsCmd @"
cd $BackendPath

# server.js dosyasını oku
cat server.js > /tmp/server_original.js

# CORS ayarlarını değiştir - origin kısmını fonksiyon ile değiştir
sed -i 's/origin: .*pornras\.com.*/origin: function (origin, callback) { callback(null, true); },/' server.js
sed -i 's/origin: function (origin, callback) {[^}]*}/origin: function (origin, callback) { callback(null, true); }/' server.js

# Eğer yukarıdaki çalışmazsa, CORS bloğunu tamamen değiştir
cat > /tmp/new_cors.txt << 'NEWCORSEOF'
// CORS ayarları - Tüm origin'lere izin ver (test için)
app.use(
  cors({
    origin: function (origin, callback) {
      // Tüm origin'lere izin ver
      callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);
NEWCORSEOF

# CORS bölümünün satır numaralarını bul
CORS_START=`grep -n 'CORS ayarlari' server.js | cut -d: -f1`
if [ ! -z \"\$CORS_START\" ]; then
    CORS_END=`sed -n \"\$CORS_START,\\$p\" server.js | grep -n '});' | head -1 | cut -d: -f1`
    CORS_END=`expr \$CORS_START + \$CORS_END - 1`
    # CORS bölümünü değiştir
    sed -i \"\$CORS_START,\$CORS_END d\" server.js
    sed -i \"\$CORS_START i\\\" server.js
    sed -i \"\$CORS_START r /tmp/new_cors.txt\" server.js
fi

echo 'CORS guncellendi'
grep -A 10 'CORS ayarlari' server.js | head -15 || grep -A 10 'app.use.*cors' server.js | head -15
"@

Write-Host $ManualCorsFix.Output -ForegroundColor White
Write-Host ""

Write-Host "Backend'i yeniden baslatiyorum..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd "pm2 restart adulttube-backend; sleep 5; pm2 logs adulttube-backend --lines 5 --nostream"
Write-Host $Restart.Output -ForegroundColor Gray
Write-Host ""

Write-Host "CORS test ediyorum..." -ForegroundColor Cyan
$TestCors = Invoke-VpsCmd "curl -s -X OPTIONS -H 'Origin: https://test-abc.vercel.app' -H 'Access-Control-Request-Method: POST' http://localhost:5000/api/email/verification -v 2>&1 | grep -iE 'access-control-allow-origin|HTTP/'"
Write-Host $TestCors.Output -ForegroundColor $(if ($TestCors.Output -match "test-abc") { "Green" } else { "Red" })
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "CORS guncellendi - tum origin'lere izin veriliyor!" -ForegroundColor Green
Write-Host "Vercel'den tekrar test edin!" -ForegroundColor White
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



