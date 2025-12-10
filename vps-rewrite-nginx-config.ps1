# Nginx Config'i Tamamen Yeniden Yaz
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
        Write-Host "Nginx Config'i Tamamen Yeniden Yaziyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup5" | Out-Null
        
        # Temiz config yaz (Python ile)
        $pythonScript = @'
import re

config_path = '/etc/nginx/sites-available/api.pornras.com'

with open(config_path, 'r') as f:
    content = f.read()

# CORS header satirlarini kaldir
content = re.sub(r'\s+add_header Access-Control-Allow-Origin.*\n', '', content)
content = re.sub(r'\s+add_header Access-Control-Allow-Methods.*\n', '', content)
content = re.sub(r'\s+add_header Access-Control-Allow-Headers.*\n', '', content)
content = re.sub(r'\s+add_header Access-Control-Max-Age.*\n', '', content)
content = re.sub(r'\s+add_header Content-Length 0.*\n', '', content)
content = re.sub(r'\s+add_header Content-Type.*\n', '', content)

# OPTIONS if bloğunu kaldir
content = re.sub(r'\s+if \(\$request_method = .OPTIONS.\) \{[^}]*return 204;[^}]*\}\s*\n', '', content, flags=re.DOTALL)

# CORS yorum satirlarini kaldir
content = re.sub(r'\s*# CORS headers.*\n', '', content)
content = re.sub(r'\s*# OPTIONS request handle.*\n', '', content)
content = re.sub(r'\s*# OPTIONS preflight.*\n', '', content)

# Origin header'ını ekle (proxy_set_header X-Forwarded-Proto'dan sonra)
if 'proxy_set_header Origin' not in content:
    content = content.replace(
        'proxy_set_header X-Forwarded-Proto $scheme;',
        'proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_set_header Origin $http_origin;'
    )

with open(config_path, 'w') as f:
    f.write(content)

print('Config updated successfully')
'@
        
        Write-Host "Python script ile config duzenleniyor..." -ForegroundColor Cyan
        $pythonResult = Invoke-SSHCommand -SessionId $session.SessionId -Command "python3 -c `"$pythonScript`""
        Write-Host $pythonResult.Output
        
        # Config'i kontrol et
        Write-Host "`nGuncellenmis config (location / bloğu):" -ForegroundColor Cyan
        $locationBlock = Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -n '/location \/ {/,/^    }/p' /etc/nginx/sites-available/api.pornras.com | grep -A 15 'location /'"
        Write-Host $locationBlock.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test
            Write-Host "`nOPTIONS Request Test:" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | head -15"
            Write-Host $optionsTest.Output
            
            Write-Host "`nFix tamamlandi!" -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup5 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


