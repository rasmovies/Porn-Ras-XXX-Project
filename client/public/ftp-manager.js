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
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Dosya boyutunu formatla
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Tarihi formatla
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '-';
    }
}

// Mevcut yol
let currentPath = '/';

// Dosya listesini yükle
async function loadFiles(path = '/') {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '<div class="loading">Yükleniyor...</div>';
    
    try {
        const response = await fetch(`/api/ftp/list?path=${encodeURIComponent(path)}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        // Response'u text olarak oku, sonra JSON'a parse et
        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response text:', responseText);
            throw new Error(`Geçersiz JSON yanıtı: ${responseText.substring(0, 100)}`);
        }
        
        if (!data || typeof data !== 'object') {
            throw new Error('Geçersiz yanıt formatı');
        }
        
        if (!data.success) {
            throw new Error(data.error || 'Dosyalar yüklenemedi');
        }
        
        if (!Array.isArray(data.files)) {
            throw new Error('Geçersiz dosya listesi formatı');
        }
        
        renderFiles(data.files, path);
        updateBreadcrumb(path);
        currentPath = path;
    } catch (error) {
        console.error('Load files error:', error);
        fileList.innerHTML = `<div class="empty-state-ftp">Hata: ${error.message}<br><small>Konsolu kontrol edin</small></div>`;
        showNotification('error', 'Hata', error.message);
    }
}

// Dosyaları render et
function renderFiles(files, path) {
    const fileList = document.getElementById('fileList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Arama filtresi
    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    );
    
    if (filteredFiles.length === 0) {
        fileList.innerHTML = '<div class="empty-state-ftp">Dosya bulunamadı</div>';
        return;
    }
    
    // Klasörleri önce göster
    const directories = filteredFiles.filter(f => f.type === 'directory');
    const fileItems = filteredFiles.filter(f => f.type === 'file');
    const sortedFiles = [...directories, ...fileItems];
    
    fileList.innerHTML = sortedFiles.map(file => {
        const icon = file.type === 'directory' ? '📁' : '📄';
        const size = file.type === 'directory' ? '-' : formatFileSize(file.size);
        const date = formatDate(file.modified);
        
        // Dosya adını güvenli hale getir (XSS koruması - kapsamlı)
        const safeName = file.name
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        
        // Dosya adına tıklanınca Streamtape'e git (sadece dosyalar için ve yüklenenler klasörü dışında)
        const isSentFolder = path.includes('/gönderilenler') || path.includes('/gonderilenler');
        const fileNameClick = file.type === 'file' && !isSentFolder
            ? `onclick="openStreamtape('${safeName}')" style="cursor: pointer; text-decoration: underline;" title="Streamtape'de aç"` 
            : '';
        
        // Yüklenenler klasöründeki dosyalar için indir-taşı-kopyala butonlarını kaldır
        const showActions = !isSentFolder;
        
        return `
            <div class="file-item-ftp ${file.type}" data-name="${safeName}" data-type="${file.type}">
                <div class="file-name-ftp" ${fileNameClick}>
                    <span class="file-icon">${icon}</span>
                    <span>${file.name}</span>
                </div>
                <div class="file-size-ftp">${size}</div>
                <div class="file-date-ftp">${date}</div>
                ${showActions ? `
                <div class="file-actions">
                    ${file.type === 'file' ? `
                        <button class="file-action-btn" onclick="downloadFile('${safeName}')">⬇️ İndir</button>
                        <button class="file-action-btn" onclick="editFile('${safeName}')">✏️ Düzenle</button>
                    ` : ''}
                    <button class="file-action-btn" onclick="moveFile('${safeName}')">✂️ Taşı</button>
                    <button class="file-action-btn" onclick="copyFile('${safeName}')">📋 Kopyala</button>
                    <button class="file-action-btn" onclick="deleteFile('${safeName}')" style="color: var(--error);">🗑️ Sil</button>
                </div>
                ` : `
                <div class="file-actions">
                    <button class="file-action-btn" onclick="deleteFile('${safeName}')" style="color: var(--error);">🗑️ Sil</button>
                </div>
                `}
            </div>
        `;
    }).join('');
    
    // Klasör tıklama
    fileList.querySelectorAll('.file-item-ftp.directory').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.file-actions')) {
                const name = item.dataset.name;
                const newPath = path === '/' ? `/${name}` : `${path}/${name}`;
                loadFiles(newPath);
            }
        });
    });
}

// Breadcrumb güncelle
function updateBreadcrumb(path) {
    const breadcrumb = document.getElementById('breadcrumb');
    const parts = path.split('/').filter(p => p);
    
    breadcrumb.innerHTML = '<span class="breadcrumb-item active" data-path="/">Ana Dizin</span>';
    
    let current = '';
    parts.forEach(part => {
        current += `/${part}`;
        const item = document.createElement('span');
        item.className = 'breadcrumb-item active';
        item.dataset.path = current;
        item.textContent = part;
        item.style.cursor = 'pointer';
        item.style.transition = 'color 0.2s';
        item.addEventListener('click', () => loadFiles(current));
        item.addEventListener('mouseenter', () => {
            item.style.color = 'var(--accent)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.color = 'var(--text-primary)';
        });
        breadcrumb.appendChild(item);
    });
}

// Streamtape sayfasına git
async function openStreamtape(fileName) {
    try {
        // Streamtape URL formatı: https://streamtape.com/v/[file_id] veya https://streamtape.com/e/[file_id]
        // FTP'deki dosya adı genellikle Streamtape video ID'sini içerir
        const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        
        // Dosya adından ID'yi çıkar (uzantıyı kaldır)
        let fileId = fileName.replace(/\.[^/.]+$/, ''); // Uzantıyı kaldır
        
        // Streamtape video URL formatını dene
        // Önce /v/ formatını dene, eğer 404 alırsa /e/ formatını dene
        const streamtapeVUrl = `https://streamtape.com/v/${fileId}`;
        const streamtapeEUrl = `https://streamtape.com/e/${fileId}`;
        
        // Önce /v/ formatını aç, eğer çalışmazsa /e/ formatını dene
        // Not: Tarayıcı güvenlik nedeniyle 404 kontrolü yapamaz, bu yüzden direkt /e/ formatını kullan
        // Streamtape'in embed URL'i genellikle daha güvenilir
        const streamtapeUrl = streamtapeEUrl;
        
        window.open(streamtapeUrl, '_blank');
        showNotification('info', 'Açılıyor', `${fileName} Streamtape'de açılıyor...`);
    } catch (error) {
        console.error('Streamtape açma hatası:', error);
        showNotification('error', 'Hata', 'Streamtape sayfası açılamadı');
    }
}

// Dosya indir
async function downloadFile(fileName) {
    try {
        const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        window.open(`/api/ftp/download?path=${encodeURIComponent(filePath)}`, '_blank');
        showNotification('success', 'İndirme', `${fileName} indiriliyor...`);
    } catch (error) {
        showNotification('error', 'Hata', error.message);
    }
}

// Dosya düzenle
async function editFile(fileName) {
    try {
        const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        const response = await fetch(`/api/ftp/read?path=${encodeURIComponent(filePath)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        document.getElementById('editContent').value = data.content;
        document.getElementById('editModal').classList.add('active');
        window.editingFilePath = filePath;
    } catch (error) {
        showNotification('error', 'Hata', error.message);
    }
}

// Dosya kaydet
async function saveFile() {
    try {
        const content = document.getElementById('editContent').value;
        const filePath = window.editingFilePath;
        
        const response = await fetch('/api/ftp/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath, content })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        showNotification('success', 'Başarılı', 'Dosya kaydedildi');
        document.getElementById('editModal').classList.remove('active');
        loadFiles(currentPath);
    } catch (error) {
        showNotification('error', 'Hata', error.message);
    }
}

// Dosya taşı
async function moveFile(fileName) {
    const newPath = prompt('Yeni konum (tam yol):');
    if (!newPath) return;
    
    try {
        const fromPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        const response = await fetch('/api/ftp/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromPath, to: newPath })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        showNotification('success', 'Başarılı', 'Dosya taşındı');
        loadFiles(currentPath);
    } catch (error) {
        showNotification('error', 'Hata', error.message);
    }
}

// Dosya kopyala
async function copyFile(fileName) {
    const newPath = prompt('Kopya konumu (tam yol):');
    if (!newPath) return;
    
    try {
        const fromPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        const response = await fetch('/api/ftp/copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromPath, to: newPath })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        showNotification('success', 'Başarılı', 'Dosya kopyalandı');
        loadFiles(currentPath);
    } catch (error) {
        showNotification('error', 'Hata', error.message);
    }
}

// Dosya sil
async function deleteFile(fileName) {
    if (!confirm(`${fileName} dosyasını silmek istediğinize emin misiniz?`)) {
        return;
    }
    
    try {
        const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        
        // Vercel'de DELETE method'u bazen çalışmıyor, POST kullan
        const response = await fetch('/api/ftp/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(`Geçersiz yanıt: ${responseText.substring(0, 100)}`);
        }
        
        if (!data.success) {
            throw new Error(data.error || 'Silme işlemi başarısız');
        }
        
        showNotification('success', 'Başarılı', 'Dosya silindi');
        loadFiles(currentPath);
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('error', 'Hata', error.message);
    }
}

// Bağlantı durumunu kontrol et
async function checkConnection() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const connectionStatusValue = document.getElementById('connectionStatusValue');
    
    try {
        statusIndicator.textContent = '🟡';
        statusText.textContent = 'Bağlantı kontrol ediliyor...';
        
        const response = await fetch('/api/ftp/list?path=/');
        const data = await response.json();
        
        if (data.success) {
            statusIndicator.textContent = '🟢';
            statusText.textContent = 'Streamtape FTP\'ye bağlı';
            if (connectionStatusValue) {
                connectionStatusValue.textContent = 'Bağlı ✅';
                connectionStatusValue.style.color = 'var(--success)';
            }
        } else {
            throw new Error(data.error || 'Bağlantı başarısız');
        }
    } catch (error) {
        statusIndicator.textContent = '🔴';
        statusText.textContent = 'Bağlantı hatası: ' + error.message;
        if (connectionStatusValue) {
            connectionStatusValue.textContent = 'Bağlantı Hatası ❌';
            connectionStatusValue.style.color = 'var(--error)';
        }
    }
}

// Event listeners
document.getElementById('refreshBtn').addEventListener('click', () => {
    checkConnection();
    loadFiles(currentPath);
});
document.getElementById('searchInput').addEventListener('input', () => loadFiles(currentPath));

// Bağlantı modal işlemleri
document.getElementById('connectionBtn').addEventListener('click', () => {
    document.getElementById('connectionModal').classList.add('active');
    checkConnection();
});

document.getElementById('closeConnectionModal').addEventListener('click', () => {
    document.getElementById('connectionModal').classList.remove('active');
});

document.getElementById('closeConnectionBtn').addEventListener('click', () => {
    document.getElementById('connectionModal').classList.remove('active');
});

document.getElementById('testConnectionBtn').addEventListener('click', () => {
    checkConnection();
    showNotification('info', 'Test', 'Bağlantı test ediliyor...');
});

// Modal işlemleri
document.getElementById('closeUploadModal').addEventListener('click', () => {
    document.getElementById('uploadModal').classList.remove('active');
});

document.getElementById('cancelUploadBtn').addEventListener('click', () => {
    document.getElementById('uploadModal').classList.remove('active');
});

document.getElementById('closeFolderModal').addEventListener('click', () => {
    document.getElementById('folderModal').classList.remove('active');
});

document.getElementById('cancelFolderBtn').addEventListener('click', () => {
    document.getElementById('folderModal').classList.remove('active');
});

document.getElementById('closeEditModal').addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('saveEditBtn').addEventListener('click', saveFile);

document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('uploadModal').classList.add('active');
    document.getElementById('fileInput').value = ''; // Reset file input
    document.getElementById('uploadProgressContainer').innerHTML = ''; // Clear progress
});

// Aktif yüklemeleri takip et
const activeUploads = new Map();

// Upload panelini güncelle
function updateUploadPanel() {
    const panel = document.getElementById('uploadPanel');
    const content = document.getElementById('uploadPanelContent');
    
    if (activeUploads.size === 0) {
        panel.style.display = 'none';
        content.innerHTML = '<div class="empty-upload">Aktif yükleme yok</div>';
        return;
    }
    
    panel.style.display = 'block';
    content.innerHTML = Array.from(activeUploads.entries()).map(([fileName, data]) => {
        const progress = data.progress || 0;
        const status = data.status || 'uploading';
        const transferred = data.transferred || 0;
        const total = data.total || 0;
        const speed = data.speed || 0;
        const estimatedSeconds = data.estimatedSeconds || 0;
        
        const statusText = {
            'uploading': 'Yükleniyor...',
            'completed': 'Tamamlandı ✅',
            'error': 'Hata ❌',
            'cancelled': 'İptal edildi'
        }[status] || 'Bilinmeyen';
        
        const transferredMB = (transferred / 1024 / 1024).toFixed(2);
        const totalMB = (total / 1024 / 1024).toFixed(2);
        const speedMB = (speed / 1024 / 1024).toFixed(2);
        
        const formatTime = (seconds) => {
            if (seconds < 60) return `${Math.round(seconds)}s`;
            const mins = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60);
            return `${mins}m ${secs}s`;
        };
        
        return `
            <div class="upload-panel-item ${status}">
                <div class="upload-panel-info">
                    <span class="upload-panel-filename">${fileName}</span>
                    <span class="upload-panel-status">${statusText}</span>
                </div>
                <div class="upload-panel-progress-bar">
                    <div class="upload-panel-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="upload-panel-details">
                    <span>${Math.round(progress)}%</span>
                    ${status === 'uploading' && total > 0 ? `
                        <span>📊 ${transferredMB} MB / ${totalMB} MB</span>
                        <span>⚡ ${speedMB} MB/s</span>
                        <span>⏱️ ${formatTime(estimatedSeconds)}</span>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Dosya yükleme işlemi - Paralel yükleme
document.getElementById('confirmUploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (!files || files.length === 0) {
        showNotification('warning', 'Uyarı', 'Lütfen yüklenecek dosya seçin');
        return;
    }
    
    // Modal'ı kapat
    document.getElementById('uploadModal').classList.remove('active');
    
    // Tüm dosyaları paralel olarak yükle
    const uploadPromises = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        
        // Aktif yüklemelere ekle
        activeUploads.set(fileName, { progress: 0, status: 'uploading' });
        updateUploadPanel();
        
        // Yükleme promise'i oluştur
        const uploadPromise = new Promise((resolve, reject) => {
            try {
                // FormData ile dosyayı yükle
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', filePath);
                
                const xhr = new XMLHttpRequest();
                
                // Progress tracking - Gerçek zamanlı
                let lastLoaded = 0;
                let lastTime = Date.now();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const now = Date.now();
                        const timeDiff = (now - lastTime) / 1000; // saniye
                        const loadedDiff = e.loaded - lastLoaded;
                        const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0; // bytes/saniye
                        const remaining = e.total - e.loaded;
                        const estimatedSeconds = speed > 0 ? remaining / speed : 0;
                        
                        const percentComplete = (e.loaded / e.total) * 100;
                        const uploadData = activeUploads.get(fileName);
                        if (uploadData) {
                            uploadData.progress = percentComplete;
                            uploadData.transferred = e.loaded;
                            uploadData.total = e.total;
                            uploadData.speed = speed;
                            uploadData.estimatedSeconds = estimatedSeconds;
                            updateUploadPanel();
                        }
                        
                        lastLoaded = e.loaded;
                        lastTime = now;
                    }
                });
                
                // Upload complete
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                const uploadData = activeUploads.get(fileName);
                                if (uploadData) {
                                    uploadData.progress = 100;
                                    uploadData.status = 'completed';
                                    updateUploadPanel();
                                }
                                showNotification('success', 'Başarılı', `${fileName} yüklendi`);
                                resolve(fileName);
                                
                                // 3 saniye sonra listeden kaldır
                                setTimeout(() => {
                                    activeUploads.delete(fileName);
                                    updateUploadPanel();
                                    loadFiles(currentPath);
                                }, 3000);
                            } else {
                                throw new Error(response.error || 'Yükleme başarısız');
                            }
                        } catch (parseError) {
                            // Response JSON değilse, başarılı sayabiliriz (200 status)
                            const uploadData = activeUploads.get(fileName);
                            if (uploadData) {
                                uploadData.progress = 100;
                                uploadData.status = 'completed';
                                updateUploadPanel();
                            }
                            showNotification('success', 'Başarılı', `${fileName} yüklendi`);
                            resolve(fileName);
                            
                            setTimeout(() => {
                                activeUploads.delete(fileName);
                                updateUploadPanel();
                                loadFiles(currentPath);
                            }, 3000);
                        }
                    } else {
                        const errorText = xhr.responseText || xhr.statusText;
                        let errorMsg = `HTTP ${xhr.status}: ${errorText}`;
                        try {
                            const errorResponse = JSON.parse(errorText);
                            errorMsg = errorResponse.error || errorMsg;
                        } catch (e) {}
                        const uploadData = activeUploads.get(fileName);
                        if (uploadData) {
                            uploadData.status = 'error';
                            updateUploadPanel();
                        }
                        showNotification('error', 'Hata', `${fileName}: ${errorMsg}`);
                        reject(new Error(errorMsg));
                    }
                });
                
                // Upload error
                xhr.addEventListener('error', () => {
                    const errorMsg = xhr.status === 413 
                        ? 'Dosya çok büyük. Vercel limiti: 4.5MB. Büyük dosyalar için lütfen direkt FTP kullanın.' 
                        : 'Yükleme hatası';
                    const uploadData = activeUploads.get(fileName);
                    if (uploadData) {
                        uploadData.status = 'error';
                        updateUploadPanel();
                    }
                    showNotification('error', 'Hata', `${fileName}: ${errorMsg}`);
                    reject(new Error(errorMsg));
                });
                
                // Network error
                xhr.addEventListener('abort', () => {
                    const uploadData = activeUploads.get(fileName);
                    if (uploadData) {
                        uploadData.status = 'cancelled';
                        updateUploadPanel();
                    }
                    showNotification('warning', 'İptal', `${fileName} yüklemesi iptal edildi`);
                    reject(new Error('İptal edildi'));
                });
                
                // Send request
                xhr.open('POST', '/api/ftp/upload');
                xhr.send(formData);
                
            } catch (error) {
                console.error('Upload error:', error);
                const uploadData = activeUploads.get(fileName);
                if (uploadData) {
                    uploadData.status = 'error';
                    updateUploadPanel();
                }
                showNotification('error', 'Hata', `${fileName}: ${error.message || 'Bilinmeyen hata'}`);
                reject(error);
            }
        });
        
        uploadPromises.push(uploadPromise);
    }
    
    // Tüm yüklemeleri paralel olarak başlat
    Promise.allSettled(uploadPromises).then(() => {
        // Tüm yüklemeler tamamlandığında dosya listesini yenile
        setTimeout(() => {
            loadFiles(currentPath);
        }, 1000);
    });
});

document.getElementById('newFolderBtn').addEventListener('click', () => {
    document.getElementById('folderModal').classList.add('active');
    document.getElementById('folderNameInput').value = '';
});

document.getElementById('confirmFolderBtn').addEventListener('click', async () => {
    const folderName = document.getElementById('folderNameInput').value.trim();
    if (!folderName) {
        showNotification('warning', 'Uyarı', 'Klasör adı gerekli');
        return;
    }
    
    // Klasör oluşturma: FTP'de klasör oluşturmak için önce klasör yoluna bir dosya yazıyoruz
    // Sonra o dosyayı silip klasörü bırakıyoruz (bazı FTP sunucuları için)
    // Alternatif: Sadece .keep dosyası oluştur (klasör oluşturur)
    try {
        const folderPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
        const keepFilePath = `${folderPath}/.keep`;
        
        // Önce .keep dosyası oluştur (klasör oluşturur)
        const response = await fetch('/api/ftp/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: keepFilePath, content: '' })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        showNotification('success', 'Başarılı', 'Klasör oluşturuldu');
        document.getElementById('folderModal').classList.remove('active');
        loadFiles(currentPath);
    } catch (error) {
        console.error('Folder creation error:', error);
        showNotification('error', 'Hata', error.message || 'Klasör oluşturulamadı');
    }
});

// Modal ESC tuşu desteği
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Tüm modal'ları kapat
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Modal dışına tıklayınca kapat
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Bağlantı durumu otomatik kontrol (her 30 saniyede bir)
setInterval(() => {
    checkConnection();
}, 30000);

// Yuklenecekler klasörünü yükle
async function loadYuklenecekler() {
    const section = document.getElementById('yukleneceklerSection');
    const content = document.getElementById('yukleneceklerContent');
    
    try {
        const response = await fetch('/api/ftp/list?path=/yuklenecekler');
        const data = await response.json();
        
        if (data.success && data.files && data.files.length > 0) {
            section.style.display = 'block';
            content.innerHTML = data.files.map(file => {
                const icon = file.type === 'directory' ? '📁' : '📄';
                const size = file.type === 'directory' ? '-' : formatFileSize(file.size);
                const safeName = file.name
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
                return `
                    <div class="special-folder-item" onclick="loadFiles('/yuklenecekler${file.type === 'directory' ? '/' + safeName : ''}')" style="cursor: pointer;">
                        <span class="file-icon">${icon}</span>
                        <span>${file.name}</span>
                        <span class="file-size">${size}</span>
                    </div>
                `;
            }).join('');
        } else {
            section.style.display = 'none';
        }
    } catch (error) {
        console.error('Yuklenecekler yükleme hatası:', error);
        section.style.display = 'none';
    }
}

// Upload panel kapatma
document.getElementById('closeUploadPanel').addEventListener('click', () => {
    document.getElementById('uploadPanel').style.display = 'none';
});

// Seçilen yerel dosyalar
let selectedLocalFiles = [];

// Yerel dosya seçme
document.getElementById('selectLocalFilesBtn').addEventListener('click', () => {
    document.getElementById('localFileInput').click();
});

document.getElementById('localFileInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Yeni dosyaları ekle (duplikasyon kontrolü)
    files.forEach(file => {
        const exists = selectedLocalFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            selectedLocalFiles.push(file);
        }
    });
    
    updateSelectedFilesList();
    showNotification('success', 'Dosyalar Seçildi', `${files.length} dosya seçildi`);
});

// Seçilen dosyalar listesini güncelle
function updateSelectedFilesList() {
    const container = document.getElementById('selectedLocalFiles');
    const list = document.getElementById('selectedFilesList');
    const uploadBtn = document.getElementById('uploadSelectedFilesBtn');
    
    if (selectedLocalFiles.length === 0) {
        container.style.display = 'none';
        uploadBtn.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    uploadBtn.style.display = 'inline-block';
    
    list.innerHTML = selectedLocalFiles.map((file, index) => {
        const size = formatFileSize(file.size);
        return `
            <div class="selected-file-item">
                <div class="selected-file-item-info">
                    <span class="file-icon">📄</span>
                    <span class="selected-file-item-name">${file.name}</span>
                </div>
                <span class="selected-file-item-size">${size}</span>
                <button class="selected-file-item-remove" onclick="removeSelectedFile(${index})">✕</button>
            </div>
        `;
    }).join('');
}

// Seçilen dosyayı kaldır
function removeSelectedFile(index) {
    selectedLocalFiles.splice(index, 1);
    updateSelectedFilesList();
}

// Tüm seçilen dosyaları temizle
document.getElementById('clearSelectedFiles').addEventListener('click', () => {
    selectedLocalFiles = [];
    document.getElementById('localFileInput').value = '';
    updateSelectedFilesList();
    showNotification('info', 'Temizlendi', 'Seçilen dosyalar temizlendi');
});

// Seçilen dosyaları yükle
document.getElementById('uploadSelectedFilesBtn').addEventListener('click', async () => {
    if (selectedLocalFiles.length === 0) {
        showNotification('warning', 'Uyarı', 'Yüklenecek dosya seçin');
        return;
    }
    
    // Yükleme panelini göster
    const panel = document.getElementById('uploadPanel');
    panel.style.display = 'block';
    
    // Tüm dosyaları paralel olarak yükle
    const uploadPromises = [];
    
    for (let i = 0; i < selectedLocalFiles.length; i++) {
        const file = selectedLocalFiles[i];
        const fileName = file.name;
        const filePath = `/yuklenecekler/${fileName}`;
        
        // Aktif yüklemelere ekle
        activeUploads.set(fileName, { progress: 0, status: 'uploading' });
        updateUploadPanel();
        
        // Yükleme promise'i oluştur
        const uploadPromise = new Promise((resolve, reject) => {
            try {
                // FormData ile dosyayı yükle
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', filePath);
                
                const xhr = new XMLHttpRequest();
                
                // Progress tracking - Gerçek zamanlı
                let lastLoaded = 0;
                let lastTime = Date.now();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const now = Date.now();
                        const timeDiff = (now - lastTime) / 1000; // saniye
                        const loadedDiff = e.loaded - lastLoaded;
                        const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0; // bytes/saniye
                        const remaining = e.total - e.loaded;
                        const estimatedSeconds = speed > 0 ? remaining / speed : 0;
                        
                        const percentComplete = (e.loaded / e.total) * 100;
                        const uploadData = activeUploads.get(fileName);
                        if (uploadData) {
                            uploadData.progress = percentComplete;
                            uploadData.transferred = e.loaded;
                            uploadData.total = e.total;
                            uploadData.speed = speed;
                            uploadData.estimatedSeconds = estimatedSeconds;
                            updateUploadPanel();
                        }
                        
                        lastLoaded = e.loaded;
                        lastTime = now;
                    }
                });
                
                // Upload complete
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                const uploadData = activeUploads.get(fileName);
                                if (uploadData) {
                                    uploadData.progress = 100;
                                    uploadData.status = 'completed';
                                    updateUploadPanel();
                                }
                                showNotification('success', 'Başarılı', `${fileName} yüklendi`);
                                resolve(fileName);
                                
                                // 3 saniye sonra listeden kaldır
                                setTimeout(() => {
                                    activeUploads.delete(fileName);
                                    updateUploadPanel();
                                }, 3000);
                            } else {
                                throw new Error(response.error || 'Yükleme başarısız');
                            }
                        } catch (parseError) {
                            // Response JSON değilse, başarılı sayabiliriz (200 status)
                            const uploadData = activeUploads.get(fileName);
                            if (uploadData) {
                                uploadData.progress = 100;
                                uploadData.status = 'completed';
                                updateUploadPanel();
                            }
                            showNotification('success', 'Başarılı', `${fileName} yüklendi`);
                            resolve(fileName);
                            
                            setTimeout(() => {
                                activeUploads.delete(fileName);
                                updateUploadPanel();
                            }, 3000);
                        }
                    } else {
                        const errorText = xhr.responseText || xhr.statusText;
                        let errorMsg = `HTTP ${xhr.status}: ${errorText}`;
                        try {
                            const errorResponse = JSON.parse(errorText);
                            errorMsg = errorResponse.error || errorMsg;
                        } catch (e) {}
                        const uploadData = activeUploads.get(fileName);
                        if (uploadData) {
                            uploadData.status = 'error';
                            updateUploadPanel();
                        }
                        showNotification('error', 'Hata', `${fileName}: ${errorMsg}`);
                        reject(new Error(errorMsg));
                    }
                });
                
                // Upload error
                xhr.addEventListener('error', () => {
                    const errorMsg = xhr.status === 413 
                        ? 'Dosya çok büyük. Vercel limiti: 4.5MB. Büyük dosyalar için lütfen direkt FTP kullanın.' 
                        : 'Yükleme hatası';
                    const uploadData = activeUploads.get(fileName);
                    if (uploadData) {
                        uploadData.status = 'error';
                        updateUploadPanel();
                    }
                    showNotification('error', 'Hata', `${fileName}: ${errorMsg}`);
                    reject(new Error(errorMsg));
                });
                
                // Network error
                xhr.addEventListener('abort', () => {
                    const uploadData = activeUploads.get(fileName);
                    if (uploadData) {
                        uploadData.status = 'cancelled';
                        updateUploadPanel();
                    }
                    showNotification('warning', 'İptal', `${fileName} yüklemesi iptal edildi`);
                    reject(new Error('İptal edildi'));
                });
                
                // Send request
                xhr.open('POST', '/api/ftp/upload');
                xhr.send(formData);
                
            } catch (error) {
                console.error('Upload error:', error);
                const uploadData = activeUploads.get(fileName);
                if (uploadData) {
                    uploadData.status = 'error';
                    updateUploadPanel();
                }
                showNotification('error', 'Hata', `${fileName}: ${error.message || 'Bilinmeyen hata'}`);
                reject(error);
            }
        });
        
        uploadPromises.push(uploadPromise);
    }
    
    // Tüm yüklemeleri paralel olarak başlat
    Promise.allSettled(uploadPromises).then(() => {
        // Yüklemeler tamamlandığında seçilen dosyaları temizle
        selectedLocalFiles = [];
        document.getElementById('localFileInput').value = '';
        updateSelectedFilesList();
        
        // Dosya listesini yenile
        setTimeout(() => {
            loadFiles(currentPath);
            loadYuklenecekler();
        }, 1000);
    });
});

// Yuklenecekler toggle
let yukleneceklerExpanded = true;
document.getElementById('toggleYuklenecekler').addEventListener('click', () => {
    yukleneceklerExpanded = !yukleneceklerExpanded;
    const content = document.getElementById('yukleneceklerContent');
    const toggle = document.getElementById('toggleYuklenecekler');
    
    if (yukleneceklerExpanded) {
        content.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
    }
});

// İlk yükleme
loadFiles('/');
checkConnection(); // Bağlantı durumunu kontrol et
loadYuklenecekler(); // Yuklenecekler klasörünü yükle

