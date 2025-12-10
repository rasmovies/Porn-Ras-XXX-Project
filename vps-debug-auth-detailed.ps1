$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DETAYLI AUTHENTICATION DEBUG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Password ve username kontrol:" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e \`
  require('dotenv').config();
  const user = process.env.PROTON_SMTP_USERNAME;
  const pass = process.env.PROTON_SMTP_PASSWORD;
  console.log('USERNAME:', JSON.stringify(user));
  console.log('USERNAME LENGTH:', user ? user.length : 0);
  console.log('PASSWORD:', JSON.stringify(pass));
  console.log('PASSWORD LENGTH:', pass ? pass.length : 0);
  console.log('PASSWORD FIRST 5:', pass ? pass.substring(0, 5) : 'YOK');
  console.log('PASSWORD LAST 5:', pass ? pass.substring(pass.length - 5) : 'YOK');
\`"
Write-Host $EnvTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/6] Bridge loglari (son SMTP istekleri):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 50 --no-pager | grep -i -E 'smtp|auth|login|username|password' | tail -15"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/6] SMTP manuel test (Node.js ile):" -ForegroundColor Cyan
$NodeTest = Invoke-VpsCmd "cd $BackendPath && node << 'EOFTEST'
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 1025,
  secure: false,
  auth: {
    user: process.env.PROTON_SMTP_USERNAME,
    pass: process.env.PROTON_SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    requireTLS: true,
  },
  debug: true,
  logger: true,
});

console.log('Testing SMTP connection...');
transporter.verify((error, success) => {
  if (error) {
    console.log('ERROR:', error.message);
    console.log('ERROR CODE:', error.code);
    console.log('ERROR RESPONSE:', error.response);
  } else {
    console.log('SUCCESS: Server is ready to take our messages');
  }
});
EOFTEST
"
Write-Host $NodeTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/6] emailService.js auth konfigurasyonu:" -ForegroundColor Cyan
$AuthConfig = Invoke-VpsCmd "cd $BackendPath/services && grep -A 8 'auth:' emailService.js"
Write-Host $AuthConfig.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/6] Backend error loglari (tam):" -ForegroundColor Red
$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 30 --nostream 2>&1 | tail -30"
Write-Host $ErrorLogs.Output -ForegroundColor Red

Write-Host ""
Write-Host "[6/6] Bridge account durumu:" -ForegroundColor Cyan
Write-Host "NOT: Bridge GUI'den kontrol edilmesi gerekiyor" -ForegroundColor Yellow
Write-Host "VPS'te calistir:" -ForegroundColor Yellow
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

