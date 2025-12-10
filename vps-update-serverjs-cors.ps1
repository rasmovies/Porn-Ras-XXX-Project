$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

Import-Module Posh-SSH -Force

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SERVER.JS CORS GUNCELLENIYOR" -ForegroundColor Cyan
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

Write-Host "[1/3] Mevcut CORS ayarlari guncelleniyor..." -ForegroundColor Cyan
$UpdateCORS = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
cp server.js server.js.old

# Eski CORS ayarini yeni allowedOrigins array'i ile degistir
sed -i "/CORS ayarlari - sadece www.pornras.com/,/});/ {
    /CORS ayarlari - sadece www.pornras.com/d
    /cors({/a\
// CORS ayarlari - Vercel deployment URL'leri ve domain'e izin ver\
const allowedOrigins = [\
  'https://www.pornras.com',\
  'https://api.pornras.com', // Backend API domain\
  'http://localhost:3000',\
  'http://localhost:3001',\
  // Vercel deployment URL'leri icin regex pattern\
  /^https:\\/\\/.*\\.vercel\\.app\$/,/\
  /^https:\\/\\/.*-.*\\.vercel\\.app\$/,/\
];\
\
    /origin: 'https:\/\/www.pornras.com',/c\
    origin: function (origin, callback) {\
      // Origin yoksa (same-origin veya mobile app gibi) izin ver\
      if (!origin) return callback(null, true);\
      \
      // Exact match kontrolu\
      if (allowedOrigins.some(allowed => {\
        if (typeof allowed === 'string') {\
          return allowed === origin;\
        } else if (allowed instanceof RegExp) {\
          return allowed.test(origin);\
        }\
        return false;\
      })) {\
        callback(null, true);\
      } else {\
        console.log('⚠️  CORS blocked origin:', origin);\
        callback(new Error('Not allowed by CORS'));\
      }\
    },
}" server.js

echo 'CORS guncellendi'
echo '---'
grep -A 15 "allowedOrigins\|CORS ayarlari" server.js | head -20
"@
Write-Host $UpdateCORS.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[2/3] Daha basit yontem: Direkt dosyayi guncelliyorum..." -ForegroundColor Cyan
$SimpleUpdate = Invoke-VpsCmd @"
cd /var/www/adulttube-backend/server
cp server.js server.js.backup2

# Eski origin satirini allowedOrigins ile degistir
sed -i "s|origin: 'https://www.pornras.com',|origin: function (origin, callback) { if (!origin) return callback(null, true); const allowed = ['https://www.pornras.com', 'https://api.pornras.com', 'http://localhost:3000', 'http://localhost:3001']; const isAllowed = allowed.includes(origin) || /vercel\.app\$/.test(origin); if (isAllowed) callback(null, true); else { console.log('CORS blocked:', origin); callback(new Error('Not allowed')); } },|" server.js

echo 'Basit CORS guncellendi'
grep -B 2 -A 10 "origin: function" server.js | head -15
"@
Write-Host $SimpleUpdate.Output -ForegroundColor Gray
Write-Host ""

Write-Host "[3/3] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
$Restart = Invoke-VpsCmd "pm2 restart adulttube-backend && sleep 3 && pm2 status | grep adulttube-backend"
Write-Host $Restart.Output -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Remove-SSHSession -SessionId $Session.SessionId | Out-Null


