# OPTIONS Blogunu Zorla Kaldir
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
        Write-Host "OPTIONS Blogunu Zorla Kaldiriyor..." -ForegroundColor Cyan
        
        # Yedekle
        Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com /etc/nginx/sites-available/api.pornras.com.backup12" | Out-Null
        
        # Python ile satır satır işle
        $pythonScript = @'
config_path = '/etc/nginx/sites-available/api.pornras.com'

with open(config_path, 'r') as f:
    lines = f.readlines()

new_lines = []
in_options_block = False
options_brace_count = 0

for i, line in enumerate(lines):
    # OPTIONS if bloğunun başlangıcı
    if 'if ($request_method' in line and 'OPTIONS' in line:
        in_options_block = True
        options_brace_count = 1
        continue
    
    # OPTIONS bloğu içindeysek
    if in_options_block:
        # Brace sayısını takip et
        if '{' in line:
            options_brace_count += line.count('{')
        if '}' in line:
            options_brace_count -= line.count('}')
        
        # Bloğun sonu
        if options_brace_count == 0:
            in_options_block = False
        continue
    
    new_lines.append(line)

# Origin header'ını ekle (yoksa)
content = ''.join(new_lines)
if 'proxy_set_header Origin' not in content:
    content = content.replace(
        'proxy_set_header X-Forwarded-Proto $scheme;',
        'proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_set_header Origin $http_origin;'
    )

with open(config_path, 'w') as f:
    f.write(content)

print('OPTIONS block force removed')
'@
        
        Write-Host "Python script ile OPTIONS blogu zorla kaldiriliyor..." -ForegroundColor Cyan
        $pythonResult = Invoke-SSHCommand -SessionId $session.SessionId -Command "python3 -c `"$pythonScript`""
        Write-Host $pythonResult.Output
        
        # Config'i kontrol et - OPTIONS bloğu var mı?
        Write-Host "`nOPTIONS blogu kontrolu:" -ForegroundColor Cyan
        $hasOptions = Invoke-SSHCommand -SessionId $session.SessionId -Command "grep -c 'if (\$request_method' /etc/nginx/sites-available/api.pornras.com || echo '0'"
        Write-Host "OPTIONS if blogu sayisi: $($hasOptions.Output)"
        
        # Location / bloğunu göster
        Write-Host "`nLocation / blogu:" -ForegroundColor Cyan
        $locationBlock = Invoke-SSHCommand -SessionId $session.SessionId -Command "sed -n '/location \/ {/,/^    }/p' /etc/nginx/sites-available/api.pornras.com"
        Write-Host $locationBlock.Output
        
        # Nginx test
        Write-Host "`nNginx config test ediliyor..." -ForegroundColor Cyan
        $test = Invoke-SSHCommand -SessionId $session.SessionId -Command "nginx -t 2>&1"
        Write-Host $test.Output
        
        if ($test.Output -match "syntax is ok" -or $test.Output -match "test is successful") {
            Write-Host "Nginx reload ediliyor..." -ForegroundColor Green
            Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl reload nginx" | Out-Null
            
            # Test OPTIONS - Backend CORS header'ları gelmeli
            Write-Host "`nOPTIONS Request Test (Backend CORS):" -ForegroundColor Cyan
            $optionsTest = Invoke-SSHCommand -SessionId $session.SessionId -Command "curl -s -I -X OPTIONS -H 'Origin: https://www.pornras.com' -H 'Access-Control-Request-Method: POST' https://api.pornras.com/api/email/verification | head -25"
            Write-Host $optionsTest.Output
            
            Write-Host "`nFix tamamlandi!" -ForegroundColor Green
        } else {
            Write-Host "Config hatasi! Yedek geri yukleniyor..." -ForegroundColor Red
            Invoke-SSHCommand -SessionId $session.SessionId -Command "cp /etc/nginx/sites-available/api.pornras.com.backup12 /etc/nginx/sites-available/api.pornras.com" | Out-Null
        }
        
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
    }
} catch {
    Write-Host "Hata: $($_.Exception.Message)" -ForegroundColor Red
}


