$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERCEL VE GITHUB SETUP ANALIZI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "MEVCUT DURUM:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Backend VPS'te calisiyor:" -ForegroundColor White
Write-Host "   - URL: http://72.61.139.145:5000" -ForegroundColor Gray
Write-Host "   - PM2 ile yonetiliyor" -ForegroundColor Gray
Write-Host "   - Proton Mail Bridge kullaniliyor" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Vercel Config bulundu:" -ForegroundColor White
Write-Host "   - server/vercel.json mevcut" -ForegroundColor Gray
Write-Host "   - Serverless functions yapilandirilmis" -ForegroundColor Gray
Write-Host ""
Write-Host "3. GitHub durumu:" -ForegroundColor White
Write-Host "   - env.example dosyasi var" -ForegroundColor Gray
Write-Host "   - Git repo'ya commit edilmeli mi?" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ONEMLI NOT:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "PROTON MAIL BRIDGE VERCEL'DE CALISMAZ!" -ForegroundColor Red
Write-Host ""
Write-Host "Neden:" -ForegroundColor White
Write-Host "- Vercel serverless ortamidir (local servis yoktur)" -ForegroundColor Gray
Write-Host "- Proton Mail Bridge local bir servistir (127.0.0.1)" -ForegroundColor Gray
Write-Host "- Serverless function'lar gecici ve stateless calisir" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OPSIYONLAR:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPSIYON 1: Backend sadece VPS'te (ONERILEN)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "- Backend: VPS (PM2)" -ForegroundColor White
Write-Host "- Frontend: Vercel veya baska bir yer" -ForegroundColor White
Write-Host "- Email: VPS'teki Proton Mail Bridge" -ForegroundColor White
Write-Host ""
Write-Host "Avantajlar:" -ForegroundColor Cyan
Write-Host "  + Proton Mail Bridge kullanilabilir" -ForegroundColor Gray
Write-Host "  + Tek bir backend endpoint" -ForegroundColor Gray
Write-Host "  + Daha az karmaiklik" -ForegroundColor Gray
Write-Host ""
Write-Host "Yapilacaklar:" -ForegroundColor Cyan
Write-Host "  1. Vercel'de backend'i devre disi birak (sadece frontend)" -ForegroundColor Gray
Write-Host "  2. GitHub'da env.example'i guncelle" -ForegroundColor Gray
Write-Host "  3. VPS backend URL'i kullan" -ForegroundColor Gray
Write-Host ""

Write-Host "OPSIYON 2: Backend hem VPS hem Vercel'de" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "- Backend: VPS (email icin) + Vercel (diger API'ler)" -ForegroundColor White
Write-Host "- Email: VPS'teki Proton Mail Bridge" -ForegroundColor White
Write-Host "- Diger API'ler: Vercel serverless" -ForegroundColor White
Write-Host ""
Write-Host "Not: Email servisi icin VPS'teki backend kullanilmalidir!" -ForegroundColor Red
Write-Host ""

Write-Host "OPSIYON 3: Vercel'de farkli SMTP provider" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "- Vercel'de SendGrid, Mailgun, vb. kullan" -ForegroundColor White
Write-Host "- VPS'te Proton Mail Bridge kullan" -ForegroundColor White
Write-Host "- Iki farkli email servisi (karmaiklik)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ONERILEN COZUM:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "OPSIYON 1 - Backend sadece VPS'te:" -ForegroundColor White
Write-Host ""
Write-Host "1. Vercel:" -ForegroundColor Cyan
Write-Host "   - Backend'i Vercel'den kaldir (sadece frontend deploy et)" -ForegroundColor Gray
Write-Host "   - Frontend'de API URL'i VPS backend'i goster: http://72.61.139.145:5000" -ForegroundColor Gray
Write-Host ""
Write-Host "2. GitHub:" -ForegroundColor Cyan
Write-Host "   - env.example'i guncelle (template olarak)" -ForegroundColor Gray
Write-Host "   - Gercek SMTP sifreleri GITMEZ (sadece env.example gider)" -ForegroundColor Gray
Write-Host "   - Vercel environment variables'a ekleme YAPMA (backend Vercel'de yok)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. VPS:" -ForegroundColor Cyan
Write-Host "   - Backend zaten ayarli ve calisiyor" -ForegroundColor Gray
Write-Host "   - .env dosyasi VPS'te zaten var (Git'e commit etme!)" -ForegroundColor Red
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "YAPILACAKLAR LISTESI:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "[ ] 1. env.example dosyasini guncelle (GitHub'a gidecek template)" -ForegroundColor White
Write-Host "[ ] 2. Vercel'de backend deploy'unu kontrol et" -ForegroundColor White
Write-Host "[ ] 3. Frontend'de API URL'i VPS backend'e yonlendir" -ForegroundColor White
Write-Host "[ ] 4. GitHub'a commit yap (env.example disinda sifreler GITMEZ)" -ForegroundColor White
Write-Host ""



