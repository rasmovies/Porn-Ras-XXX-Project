$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKEND CORS KONTROLU VE DUZELTME" -ForegroundColor Cyan
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

Write-Host "[1/5] Backend server.js dosyasini kontrol ediyorum..." -ForegroundColor Cyan
$BackendPath = "/var/www/adulttube-backend/server"
$CheckServer = Invoke-VpsCmd "cd $BackendPath && grep -n 'cors\|origin' server.js | head -20"
Write-Host $CheckServer.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/5] Mevcut CORS ayarlarini gosteriyorum..." -ForegroundColor Cyan
$CorsConfig = Invoke-VpsCmd "cd $BackendPath && grep -A 10 'app.use.*cors' server.js"
Write-Host $CorsConfig.Output -ForegroundColor White
Write-Host ""

Write-Host "[3/5] Vercel domain'lerini ekleyecegim..." -ForegroundColor Cyan
Write-Host "NOT: Vercel deployment URL'leri CORS'a eklenmeli" -ForegroundColor Yellow
Write-Host ""

# CORS'u güncelle - Vercel domain'lerini ekle
$UpdateCors = Invoke-VpsCmd @"
cd $BackendPath

# server.js dosyasını yedekle
cp server.js server.js.backup.`$(date +%Y%m%d_%H%M%S)

# CORS ayarlarını güncelle - Vercel domain'lerini ekle
cat > /tmp/cors_update.js << 'CORSEOF'
const corsOrigin = process.env.CORS_ORIGIN || 'https://www.pornras.com';
const allowedOrigins = [
  'https://www.pornras.com',
  corsOrigin,
  // Vercel deployment URL'leri
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*-.*-.*\.vercel\.app$/,
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Origin yoksa (same-origin veya mobile app) izin ver
    if (!origin) return callback(null, true);
    
    // Exact match kontrolü
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
CORSEOF

echo 'CORS config olusturuldu'
"@

Write-Host $UpdateCors.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[4/5] server.js dosyasini CORS'u tum domain'lere izin verecek sekilde guncelliyorum..." -ForegroundColor Cyan

# server.js'i güncelle - CORS'u daha açık yap
$FixCors = Invoke-VpsCmd @"
cd $BackendPath

# Mevcut CORS ayarını bul ve değiştir
sed -i 's|origin: .*pornras.com|origin: function(origin, callback) { callback(null, true); }|g' server.js

# Alternatif: Tüm origin'lere izin ver (geçici test için)
sed -i '/app.use.*cors/,/})/c\
app.use(cors({\
  origin: function(origin, callback) {\
    // Tüm origin\'lere izin ver (production\'da kısıtlayın)\
    callback(null, true);\
  },\
  methods: [\"GET\", \"POST\", \"OPTIONS\"],\
  allowedHeaders: [\"Content-Type\", \"Authorization\"],\
  credentials: false,\
  optionsSuccessStatus: 200,\
}))' server.js

echo 'CORS guncellendi'
cat server.js | grep -A 10 'app.use.*cors' | head -15
"@

Write-Host $FixCors.Output -ForegroundColor White
Write-Host ""

Write-Host "[5/5] Backend'i yeniden baslatiyorum..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd "pm2 restart adulttube-backend; sleep 3; pm2 status adulttube-backend | head -3"
Write-Host $Restart.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORS TEST" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend'i test ediyorum..." -ForegroundColor Cyan
$TestBackend = Invoke-VpsCmd "curl -s -H 'Origin: https://test.vercel.app' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type' -X OPTIONS http://localhost:5000/api/email/verification -v 2>&1 | grep -i 'access-control' || curl -s http://localhost:5000/health"
Write-Host $TestBackend.Output -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SONUC:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "CORS ayarlari guncellendi!" -ForegroundColor Green
Write-Host ""
Write-Host "Vercel'de test edin:" -ForegroundColor White
Write-Host "  - Vercel deployment URL'inizden test edin" -ForegroundColor Gray
Write-Host "  - CORS artik tum origin'lere izin veriyor (test icin)" -ForegroundColor Gray
Write-Host ""
Write-Host "Production icin CORS'u kısıtlamak isterseniz:" -ForegroundColor Yellow
Write-Host "  - server.js'de allowedOrigins listesine domain ekleyin" -ForegroundColor Gray
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null



