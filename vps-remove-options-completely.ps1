# OPTIONS Blogunu Tamamen Kaldir - Backend'e Ilet
$vpsIP = "72.61.139.145"
$vpsUser = "root"
$vpsPassword = "Oyunbozan1907+"

if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Install-PackageProvider -Name NuGet -Force -Scope CurrentUser | Out-Null
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
}

try {
    $securePassword = ConvertTo-SecureString $vpsPassword -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($vpsUser, $securePassword)
    $session = New-SSHSession -ComputerName $vpsIP -Credential $credential -AcceptKey
    
    if ($session) {
        Write-Host "OPTIONS Blogunu Tamamen Kaldiriyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup11" | Out-Null
        
        # Python ile OPTIONS bloğunu kaldır
        $pythonScript = @'
import re

config_path = '/etc/nginx/sites-available/api.pornras.com'

with open(config_path, 'r') as f:
    content = f.read()

# OPTIONS if bloğunu tamamen kaldır (return 204 dahil)
content = re.sub(r'\s+if \(\$request_method = .OPTIONS.\) \{\s*return 204;\s*\}\s*\n', '\n', content)

# Origin header'ını ekle (yoksa)
if 'proxy_set_header Origin' not in content:
    content = content.replace(
        'proxy_set_header X-Forwarded-Proto $scheme;',
        'proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_set_header Origin $http_origin;'
    )

with open(config_path, 'w') as f:
    f.write(content)

print('OPTIONS block removed successfully')
'@
        
        Write-Host "Python script ile OPTIONS blogu kaldiriliyor..." -ForegroundColor Cyan
        $pythonResult = Invoke-SSHCommand -SessionId $session.SessionId -Command "python3 -c `"$pythonScript`""
        Write-Host $pythonResult.Output
        
        # Config'i kontrol et
        Write-Host "`nGuncellenmis config (location / bloğu):" -ForegroundColor Cyan
        $locationBlock = Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -n '/server_name api.pornras.com/,/^}/p' /etc/nginx/sites-available/api.pornras.com | grep -A 15 'location / {'"
        Write-Host $locationBlock.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t 2>&1"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test OPTIONS - Backend'den CORS header'ları gelmeli
            Write-Host "`nOPTIONS Request Test (Backend CORS):" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | head -20"
            Write-Host $optionsTest.Output
            
            Write-Host "`nFix tamamlandi! OPTIONS request backend'e iletilecek." -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup11 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


