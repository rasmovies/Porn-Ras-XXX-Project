$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORS AYARLARI TAM DUZELTME" -ForegroundColor Cyan
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

Write-Host "[1/4] Mevcut server.js CORS ayarlari kontrol..." -ForegroundColor Cyan
$CurrentCORS = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
grep -n "cors\|origin\|allowedOrigins" server.js | head -15
"@
Write-Host $CurrentCORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/4] CORS ayarlarini tam olarak guncelliyorum..." -ForegroundColor Cyan
$UpdateCORS = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
cp server.js server.js.backup_cors_fix

# Eski CORS ayarini bul ve degistir
sed -i '/app.use(cors({/,/}));/ {
    /app.use(cors({/a\
  cors({\
    origin: function (origin, callback) {\
      if (!origin) return callback(null, true);\
      const allowed = [\
        '\''https://www.pornras.com'\'',\
        '\''https://api.pornras.com'\'',\
        '\''http://localhost:3000'\'',\
        '\''http://localhost:3001'\''\
      ];\
      const isVercel = /vercel\\.app\$/.test(origin);\
      if (allowed.includes(origin) || isVercel) {\
        callback(null, true);\
      } else {\
        console.log('\''CORS blocked:'\'', origin);\
        callback(new Error('\''Not allowed by CORS'\''));\
      }\
    },\
    methods: ['\''GET'\'', '\''POST'\'', '\''OPTIONS'\''],\
    allowedHeaders: ['\''Content-Type'\'', '\''Authorization'\''],\
    credentials: false,\
    optionsSuccessStatus: 200,\
    preflightContinue: false\
  })
    /origin: 'https:\/\/www.pornras.com',/d
    /methods:/d
    /allowedHeaders:/d
    /credentials:/d
    /optionsSuccessStatus:/d
    /preflightContinue:/d
}" server.js

# Eger hala eski format varsa, direkt degistir
sed -i "s|origin: 'https://www.pornras.com',|origin: function (origin, callback) { if (!origin) return callback(null, true); const allowed = ['https://www.pornras.com', 'https://api.pornras.com', 'http://localhost:3000', 'http://localhost:3001']; const isVercel = /vercel\\.app\$/.test(origin); if (allowed.includes(origin) || isVercel) callback(null, true); else { console.log('CORS blocked:', origin); callback(new Error('Not allowed')); } },|" server.js

echo 'CORS guncellendi'
echo '---'
grep -A 15 "origin: function\|cors({" server.js | head -20
"@
Write-Host $UpdateCORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/4] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd "pm2 restart adulttube-backend && sleep 3 && pm2 logs adulttube-backend --lines 5 --nostream 2>&1 | tail -5"
Write-Host $Restart.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/4] CORS test ediliyor..." -ForegroundColor Cyan
$TestCORS = Invoke-VpsCmd @"
echo '=== OPTIONS Preflight Test ==='
curl -s -X OPTIONS https://api.pornras.com/api/email/verification \
  -H 'Origin: https://www.pornras.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  -i 2>&1 | grep -E '(HTTP|Access-Control|Origin)' | head -10

echo ''
echo '=== POST Test ==='
curl -s -X POST https://api.pornras.com/api/email/verification \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://www.pornras.com' \
  -d '{\"email\":\"test@example.com\",\"username\":\"testuser\",\"verifyUrl\":\"https://www.pornras.com/verify?token=123\"}' \
  2>&1 | head -5
"@
Write-Host $TestCORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "CORS AYARLARI GUNCELLENDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "SON ADIM: Vercel'de environment variable kontrol edin!" -ForegroundColor Yellow
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


