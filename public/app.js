// Socket.io bağlantısı
const socket = io();

// Ses efektleri oluştur
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'success') {
            // Yüksek, kısa, hoş bir ses
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } else if (type === 'error' || type === 'warning') {
            // Düşük, kısa, uyarı sesi
            oscillator.frequency.value = 400;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        }
    } catch (error) {
        // Ses çalma hatası sessizce yoksayılır
        console.log('Ses çalınamadı:', error);
    }
}

// Bildirim sistemi
function showNotification(type, title, message) {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Ses çal
    playSound(type);
    
    // 5 saniye sonra kaldır
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Dosya boyutunu formatla
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Tarihi formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Dosya listesini render et
function renderFileList(files, containerId, type = 'pending') {
    const container = document.getElementById(containerId);
    
    if (files.length === 0) {
        container.innerHTML = '<div class="empty-state">Dosya bulunamadı</div>';
        return;
    }
    
    container.innerHTML = files.map(file => {
        const status = uploadStatuses[file.name] || file.status || 'pending';
        const progress = uploadProgress[file.name];
        const statusTexts = {
            pending: 'Bekliyor',
            uploading: 'Yükleniyor...',
            success: 'Yüklendi',
            error: 'Hata',
            cancelled: 'İptal Edildi'
        };
        
        // Tahmini süreyi formatla
        function formatTime(seconds) {
            if (!seconds || seconds === Infinity || isNaN(seconds)) return '-';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            if (mins > 0) {
                return `${mins} dk ${secs} sn`;
            }
            return `${secs} sn`;
        }
        
        // Hızı formatla
        function formatSpeed(bytesPerSecond) {
            if (!bytesPerSecond || bytesPerSecond === 0) return '-';
            return formatFileSize(bytesPerSecond) + '/s';
        }
        
        return `
            <div class="file-item ${status}" data-file="${file.name}">
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span>${formatFileSize(file.size)}</span>
                        <span>${formatDate(file.modified)}</span>
                    </div>
                    ${status === 'uploading' && progress ? `
                        <div class="upload-progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                            </div>
                            <div class="progress-info">
                                <span>${progress.percentage}%</span>
                                <span>${formatSpeed(progress.speed)}</span>
                                <span>Kalan: ${formatTime(progress.estimatedSeconds)}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="file-status ${status}">
                    ${status === 'uploading' ? '<div class="spinner"></div>' : ''}
                    ${statusTexts[status]}
                </div>
            </div>
        `;
    }).join('');
}

// Dosyaları yükle
async function loadFiles() {
    try {
        const [pendingFiles, sentFiles] = await Promise.all([
            fetch('/api/files').then(r => r.json()),
            fetch('/api/sent-files').then(r => r.json())
        ]);
        
        renderFileList(pendingFiles, 'pendingFiles', 'pending');
        renderFileList(sentFiles, 'sentFiles', 'sent');
    } catch (error) {
        showNotification('error', 'Hata', 'Dosyalar yüklenirken bir hata oluştu');
    }
}

// Durum bilgisini yükle
async function loadStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        document.getElementById('uploadDir').textContent = data.uploadDir;
        document.getElementById('sentDir').textContent = data.sentDir;
        
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (data.watching) {
            statusDot.classList.add('active');
            statusText.textContent = 'İzleme Aktif';
        } else {
            statusDot.classList.remove('active');
            statusText.textContent = 'İzleme Kapalı';
        }
    } catch (error) {
        showNotification('error', 'Hata', 'Durum bilgisi alınamadı');
    }
}

// Tab değiştirme
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// Yükleme durumlarını takip et
const uploadStatuses = {};
const uploadProgress = {}; // { fileName: { percentage, speed, estimatedSeconds } }

// Socket.io event listeners
socket.on('connect', () => {
    showNotification('success', 'Bağlantı', 'Sunucuya bağlandı');
    loadStatus();
    loadFiles();
});

socket.on('disconnect', () => {
    showNotification('warning', 'Bağlantı', 'Sunucu bağlantısı kesildi');
    document.getElementById('statusDot').classList.remove('active');
    document.getElementById('statusText').textContent = 'Bağlantı Yok';
});

// Onay bekleyen yüklemeler
const pendingApprovals = new Map(); // { fileName: { fileSize, timestamp } }

socket.on('upload-pending-approval', (data) => {
    console.log('🔔 Onay isteği alındı:', data);
    const { fileName, fileSize, timestamp } = data;
    
    // Dosya bilgilerini kaydet
    pendingApprovals.set(fileName, { fileSize, timestamp });
    
    // Onay modal'ı göster - daha görünür bir dialog
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    const message = `📤 YÜKLEME ONAYI\n\nDosya: ${fileName}\nBoyut: ${fileSizeMB} MB\n\nBu dosyayı FTP'ye yüklemek istiyor musunuz?`;
    
    // Sayfayı focus et (kullanıcı başka tab'de olabilir)
    window.focus();
    
    // Notification göster
    showNotification('warning', 'Yükleme Onayı Bekleniyor', `${fileName} için onay bekleniyor...`);
    
    // Dialog göster
    setTimeout(() => {
        if (confirm(message)) {
        // Onay verildi
        console.log('✅ Yükleme onaylandı:', fileName);
        socket.emit('approve-upload', { fileName });
        uploadStatuses[fileName] = 'uploading';
        uploadProgress[fileName] = { percentage: 0, speed: 0, estimatedSeconds: 0, transferred: 0, total: 0 };
        showNotification('success', 'Yükleme Onaylandı', `${fileName} yükleniyor...`);
        loadFiles();
        updateProgressPanel();
        } else {
            // Reddedildi
            console.log('❌ Yükleme reddedildi:', fileName);
            socket.emit('reject-upload', { fileName });
            showNotification('warning', 'Yükleme İptal', `${fileName} yüklemesi iptal edildi`);
            pendingApprovals.delete(fileName);
        }
    }, 500); // Kısa bir gecikme ile göster (notification'ın görünmesi için)
});

socket.on('upload-cancelled', (data) => {
    const { fileName, reason } = data;
    uploadStatuses[fileName] = 'cancelled';
    delete uploadProgress[fileName];
    pendingApprovals.delete(fileName);
    showNotification('warning', 'Yükleme İptal', `${fileName}: ${reason}`);
    loadFiles();
});

socket.on('upload-start', (data) => {
    uploadStatuses[data.fileName] = 'uploading';
    uploadProgress[data.fileName] = { percentage: 0, speed: 0, estimatedSeconds: 0, transferred: 0, total: 0 };
    showNotification('warning', 'Yükleme Başladı', `${data.fileName} yükleniyor...`);
    loadFiles();
    updateProgressPanel(); // İlerleme panelini göster
});

socket.on('upload-progress', (data) => {
    uploadProgress[data.fileName] = {
        percentage: data.percentage,
        speed: data.speed,
        estimatedSeconds: data.estimatedSeconds,
        transferred: data.transferred || 0,
        total: data.total || 0
    };
    // Sadece ilgili dosyayı güncelle (tüm listeyi yeniden yükleme)
    updateFileProgress(data.fileName);
    // İlerleme panelini güncelle
    updateProgressPanel();
});

socket.on('upload-result', (result) => {
    if (result.success) {
        uploadStatuses[result.fileName] = 'success';
        delete uploadProgress[result.fileName];
        showNotification('success', 'Yükleme Başarılı', `${result.fileName} başarıyla yüklendi`);
    } else {
        uploadStatuses[result.fileName] = 'error';
        delete uploadProgress[result.fileName];
        showNotification('error', 'Yükleme Hatası', `${result.fileName}: ${result.error}`);
    }
    setTimeout(() => {
        delete uploadStatuses[result.fileName];
    }, 5000);
    loadFiles();
    updateProgressPanel(); // İlerleme panelini güncelle
});

// Belirli bir dosyanın ilerlemesini güncelle
function updateFileProgress(fileName) {
    const fileItem = document.querySelector(`[data-file="${fileName}"]`);
    if (!fileItem) {
        loadFiles(); // Dosya bulunamazsa tüm listeyi yeniden yükle
        return;
    }
    
    const progress = uploadProgress[fileName];
    if (!progress) return;
    
    // Progress bar'ı güncelle
    const progressFill = fileItem.querySelector('.progress-fill');
    const progressInfo = fileItem.querySelector('.progress-info');
    
    if (progressFill) {
        progressFill.style.width = `${progress.percentage}%`;
    }
    
    if (progressInfo) {
        function formatTime(seconds) {
            if (!seconds || seconds === Infinity || isNaN(seconds)) return '-';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            if (mins > 0) {
                return `${mins} dk ${secs} sn`;
            }
            return `${secs} sn`;
        }
        
        function formatSpeed(bytesPerSecond) {
            if (!bytesPerSecond || bytesPerSecond === 0) return '-';
            return formatFileSize(bytesPerSecond) + '/s';
        }
        
        progressInfo.innerHTML = `
            <span>${progress.percentage}%</span>
            <span>${formatSpeed(progress.speed)}</span>
            <span>Kalan: ${formatTime(progress.estimatedSeconds)}</span>
        `;
    }
}

// Periyodik olarak dosya listesini güncelle
setInterval(loadFiles, 5000);

// İlerleme panelini güncelle
function updateProgressPanel() {
    const panel = document.getElementById('progressPanel');
    const content = document.getElementById('progressPanelContent');
    
    if (!panel || !content) return;
    
    // Aktif yüklemeleri bul
    const activeUploads = Object.keys(uploadStatuses).filter(
        fileName => uploadStatuses[fileName] === 'uploading'
    );
    
    if (activeUploads.length === 0) {
        panel.style.display = 'none';
        return;
    }
    
    // Paneli göster
    panel.style.display = 'flex';
    
    // İlerleme öğelerini oluştur
    content.innerHTML = activeUploads.map(fileName => {
        const progress = uploadProgress[fileName] || {};
        const percentage = progress.percentage || 0;
        const speed = progress.speed || 0;
        const estimatedSeconds = progress.estimatedSeconds || 0;
        const transferred = progress.transferred || 0;
        const total = progress.total || 0;
        
        function formatTime(seconds) {
            if (!seconds || seconds === Infinity || isNaN(seconds)) return '-';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            if (mins > 0) {
                return `${mins} dk ${secs} sn`;
            }
            return `${secs} sn`;
        }
        
        function formatSpeed(bytesPerSecond) {
            if (!bytesPerSecond || bytesPerSecond === 0) return '-';
            return formatFileSize(bytesPerSecond) + '/s';
        }
        
        return `
            <div class="progress-item">
                <div class="progress-item-header">
                    <div class="progress-item-name">${fileName}</div>
                    <div class="progress-item-percentage">${percentage}%</div>
                </div>
                <div class="progress-item-bar">
                    <div class="progress-item-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-item-details">
                    <span>📊 ${formatFileSize(transferred)} / ${formatFileSize(total)}</span>
                    <span>⚡ ${formatSpeed(speed)}</span>
                    <span>⏱️ Kalan: ${formatTime(estimatedSeconds)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// İlerleme paneli kapatma butonu
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeProgressPanel');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const panel = document.getElementById('progressPanel');
            if (panel) {
                panel.style.display = 'none';
            }
        });
    }
});

// İlk yükleme
loadStatus();
loadFiles();
updateProgressPanel();

