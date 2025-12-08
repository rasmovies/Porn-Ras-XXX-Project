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
        
        // Dosya adını güvenli hale getir (XSS koruması)
        const safeName = file.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        return `
            <div class="file-item-ftp ${file.type}" data-name="${safeName}" data-type="${file.type}">
                <div class="file-name-ftp">
                    <span class="file-icon">${icon}</span>
                    <span>${file.name}</span>
                </div>
                <div class="file-size-ftp">${size}</div>
                <div class="file-date-ftp">${date}</div>
                <div class="file-actions">
                    ${file.type === 'file' ? `
                        <button class="file-action-btn" onclick="downloadFile('${safeName}')">⬇️ İndir</button>
                        <button class="file-action-btn" onclick="editFile('${safeName}')">✏️ Düzenle</button>
                    ` : ''}
                    <button class="file-action-btn" onclick="moveFile('${safeName}')">✂️ Taşı</button>
                    <button class="file-action-btn" onclick="copyFile('${safeName}')">📋 Kopyala</button>
                    <button class="file-action-btn" onclick="deleteFile('${safeName}')" style="color: var(--error);">🗑️ Sil</button>
                </div>
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
        item.addEventListener('click', () => loadFiles(current));
        breadcrumb.appendChild(item);
    });
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

// Dosya yükleme işlemi
document.getElementById('confirmUploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (!files || files.length === 0) {
        showNotification('warning', 'Uyarı', 'Lütfen yüklenecek dosya seçin');
        return;
    }
    
    const progressContainer = document.getElementById('uploadProgressContainer');
    progressContainer.innerHTML = '';
    
    // Her dosya için yükleme işlemi
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        
        // Progress bar oluştur
        const progressItem = document.createElement('div');
        progressItem.className = 'upload-progress-item';
        progressItem.innerHTML = `
            <div class="upload-progress-info">
                <span>${fileName}</span>
                <span class="upload-progress-percentage">0%</span>
            </div>
            <div class="upload-progress-bar">
                <div class="upload-progress-fill" style="width: 0%"></div>
            </div>
        `;
        progressContainer.appendChild(progressItem);
        
        try {
            // FormData ile dosyayı yükle
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', filePath);
            
            const xhr = new XMLHttpRequest();
            
            // Progress tracking
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    const fill = progressItem.querySelector('.upload-progress-fill');
                    const percentage = progressItem.querySelector('.upload-progress-percentage');
                    if (fill) fill.style.width = percentComplete + '%';
                    if (percentage) percentage.textContent = Math.round(percentComplete) + '%';
                }
            });
            
            // Upload complete
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const fill = progressItem.querySelector('.upload-progress-fill');
                    const percentage = progressItem.querySelector('.upload-progress-percentage');
                    if (fill) fill.style.width = '100%';
                    if (percentage) percentage.textContent = '100%';
                    showNotification('success', 'Başarılı', `${fileName} yüklendi`);
                } else {
                    throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
                }
            });
            
            // Upload error
            xhr.addEventListener('error', () => {
                throw new Error('Yükleme hatası');
            });
            
            // Send request
            xhr.open('POST', '/api/ftp/upload');
            xhr.send(formData);
            
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('error', 'Hata', `${fileName}: ${error.message}`);
        }
    }
    
    // Modal'ı kapat
    setTimeout(() => {
        document.getElementById('uploadModal').classList.remove('active');
        loadFiles(currentPath);
    }, 2000);
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
    
    // Klasör oluşturma için uploadFrom ile boş dosya yükleyebiliriz veya özel bir endpoint ekleyebiliriz
    // Şimdilik basit bir çözüm: boş bir .keep dosyası oluştur
    try {
        const folderPath = currentPath === '/' ? `/${folderName}/.keep` : `${currentPath}/${folderName}/.keep`;
        const response = await fetch('/api/ftp/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: folderPath, content: '' })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        showNotification('success', 'Başarılı', 'Klasör oluşturuldu');
        document.getElementById('folderModal').classList.remove('active');
        loadFiles(currentPath);
    } catch (error) {
        showNotification('error', 'Hata', error.message);
    }
});

// İlk yükleme
loadFiles('/');
checkConnection(); // Bağlantı durumunu kontrol et

