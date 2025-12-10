# Tum CORS Header'larini ve OPTIONS Blogunu Kaldir
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
        Write-Host "Tum CORS Header'larini ve OPTIONS Blogunu Kaldiriyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup10" | Out-Null
        
        # Python ile temizle
        $pythonScript = @'
import re

config_path = '/etc/nginx/sites-available/api.pornras.com'

with open(config_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip_until_return = False
skip_until_brace = False
brace_count = 0

i = 0
while i < len(lines):
    line = lines[i]
    
    # OPTIONS if bloğunu atla
    if 'if ($request_method = ' in line and 'OPTIONS' in line:
        skip_until_return = True
        brace_count = 1
        i += 1
        continue
    
    if skip_until_return:
        if '{' in line:
            brace_count += line.count('{')
        if '}' in line:
            brace_count -= line.count('}')
        if 'return 204' in line:
            skip_until_return = False
            # return 204 satırını da atla
            i += 1
            continue
        i += 1
        continue
    
    # add_header CORS satırlarını atla
    if 'add_header Access-Control' in line or 'add_header Content-Length 0' in line or ('add_header Content-Type' in line and 'text/plain' in line):
        i += 1
        continue
    
    # CORS yorum satırlarını atla
    if '# CORS headers' in line or '# OPTIONS request handle' in line or '# OPTIONS preflight' in line:
        i += 1
        continue
    
    new_lines.append(line)
    i += 1

# Origin header'ını ekle (yoksa)
content = ''.join(new_lines)
if 'proxy_set_header Origin' not in content:
    content = content.replace(
        'proxy_set_header X-Forwarded-Proto $scheme;',
        'proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_set_header Origin $http_origin;'
    )

with open(config_path, 'w') as f:
    f.write(content)

print('Config cleaned successfully')
'@
        
        Write-Host "Python script ile config temizleniyor..." -ForegroundColor Cyan
        $pythonResult = Invoke-SSHCommand -SessionId $session.SessionId -Command "python3 -c `"$pythonScript`""
        Write-Host $pythonResult.Output
        
        # Config'i kontrol et
        Write-Host "`nTemizlenmis config (api.pornras.com location /):" -ForegroundColor Cyan
        $locationBlock = Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -n '/server_name api.pornras.com/,/^}/p' /etc/nginx/sites-available/api.pornras.com | grep -A 15 'location /'"
        Write-Host $locationBlock.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t 2>&1"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test
            Write-Host "`nOPTIONS Request Test (Backend CORS):" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | head -20"
            Write-Host $optionsTest.Output
            
            Write-Host "`nFix tamamlandi!" -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup10 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


