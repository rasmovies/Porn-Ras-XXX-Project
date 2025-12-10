const { ipcRenderer } = require('electron');

// State
let isConnected = false;
let currentLocalPath = require('os').homedir();
let currentRemotePath = '/';
let selectedLocalFiles = [];
let selectedRemoteFiles = [];
let uploadQueue = [];

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const localFileList = document.getElementById('localFileList');
const remoteFileList = document.getElementById('remoteFileList');
const queueList = document.getElementById('queueList');
const localPath = document.getElementById('localPath');
const remoteBreadcrumb = document.getElementById('remoteBreadcrumb');
const refreshLocalBtn = document.getElementById('refreshLocalBtn');
const refreshRemoteBtn = document.getElementById('refreshRemoteBtn');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const uploadBtn = document.getElementById('uploadBtn');
const newFolderBtn = document.getElementById('newFolderBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
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

// Load local files
async function loadLocalFiles(path) {
    try {
        const fs = require('fs');
        const files = fs.readdirSync(path, { withFileTypes: true });
        
        const fileList = files.map(file => {
            const fullPath = require('path').join(path, file.name);
            const stats = fs.statSync(fullPath);
            
            return {
                name: file.name,
                type: file.isDirectory() ? 'directory' : 'file',
                size: file.isFile() ? stats.size : 0,
                modified: stats.mtime.toISOString(),
                path: fullPath
            };
        }).sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        
        renderLocalFiles(fileList);
        localPath.textContent = path;
        currentLocalPath = path;
    } catch (error) {
        console.error('Local files load error:', error);
        localFileList.innerHTML = `<div class="empty-state">Hata: ${error.message}</div>`;
    }
}

// Render local files
function renderLocalFiles(files) {
    if (files.length === 0) {
        localFileList.innerHTML = '<div class="empty-state">Klasör boş</div>';
        return;
    }
    
    localFileList.innerHTML = files.map(file => {
        const icon = file.type === 'directory' ? '📁' : '📄';
        const size = file.type === 'directory' ? '-' : formatFileSize(file.size);
        const date = formatDate(file.modified);
        
        return `
            <div class="file-item" data-type="${file.type}" data-path="${file.path}">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${size}</span>
                <span class="file-date">${date}</span>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    localFileList.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.shiftKey || e.metaKey) {
                // Multi-select
                item.classList.toggle('selected');
            } else {
                // Single select or navigate
                const type = item.dataset.type;
                const filePath = item.dataset.path;
                
                if (type === 'directory') {
                    loadLocalFiles(filePath);
                } else {
                    // Select file
                    localFileList.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                }
            }
        });
        
        item.addEventListener('dblclick', () => {
            const type = item.dataset.type;
            const filePath = item.dataset.path;
            
            if (type === 'directory') {
                loadLocalFiles(filePath);
            }
        });
    });
}

// Load remote files
async function loadRemoteFiles(path = '/') {
    if (!isConnected) {
        remoteFileList.innerHTML = '<div class="empty-state">Bağlanın</div>';
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('ftp-list', path);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        renderRemoteFiles(result.files, path);
        updateRemoteBreadcrumb(path);
        currentRemotePath = path;
    } catch (error) {
        console.error('Remote files load error:', error);
        remoteFileList.innerHTML = `<div class="empty-state">Hata: ${error.message}</div>`;
    }
}

// Render remote files
function renderRemoteFiles(files, path) {
    if (files.length === 0) {
        remoteFileList.innerHTML = '<div class="empty-state">Klasör boş</div>';
        return;
    }
    
    // Sort: directories first
    const sortedFiles = files.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
    
    remoteFileList.innerHTML = sortedFiles.map(file => {
        const icon = file.type === 'directory' ? '📁' : '📄';
        const size = file.type === 'directory' ? '-' : formatFileSize(file.size);
        const date = formatDate(file.modified);
        
        return `
            <div class="file-item" data-type="${file.type}" data-name="${file.name}">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${size}</span>
                <span class="file-date">${date}</span>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    remoteFileList.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.shiftKey || e.metaKey) {
                item.classList.toggle('selected');
            } else {
                remoteFileList.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            }
        });
        
        item.addEventListener('dblclick', () => {
            const type = item.dataset.type;
            const fileName = item.dataset.name;
            
            if (type === 'directory') {
                const newPath = path === '/' ? `/${fileName}` : `${path}/${fileName}`;
                loadRemoteFiles(newPath);
            }
        });
    });
}

// Update remote breadcrumb
function updateRemoteBreadcrumb(path) {
    remoteBreadcrumb.innerHTML = '';
    
    const parts = path.split('/').filter(p => p);
    let current = '';
    
    // Root
    const rootItem = document.createElement('span');
    rootItem.className = 'breadcrumb-item active';
    rootItem.dataset.path = '/';
    rootItem.textContent = '/';
    rootItem.addEventListener('click', () => loadRemoteFiles('/'));
    remoteBreadcrumb.appendChild(rootItem);
    
    // Parts
    parts.forEach(part => {
        current += `/${part}`;
        const item = document.createElement('span');
        item.className = 'breadcrumb-item';
        item.dataset.path = current;
        item.textContent = part;
        item.addEventListener('click', () => loadRemoteFiles(current));
        remoteBreadcrumb.appendChild(item);
    });
}

// Update queue
function updateQueue() {
    const queueCount = document.getElementById('queueCount');
    if (queueCount) {
        queueCount.textContent = `(${uploadQueue.length})`;
    }
    
    if (uploadQueue.length === 0) {
        queueList.innerHTML = '<div class="empty-state">Yükleme kuyruğu boş<br><small style="color: var(--text-secondary);">Dosyaları sürükleyip bırakın veya sağ tıklayın</small></div>';
        return;
    }
    
    queueList.innerHTML = uploadQueue.map((item, index) => {
        const progress = item.progress || 0;
        const status = item.status || 'pending';
        const statusText = status === 'uploading' ? `${Math.round(progress)}%` : 
                          status === 'completed' ? '✅ Tamamlandı' :
                          status.startsWith('error') ? '❌ Hata' : '⏳ Bekliyor';
        
        return `
            <div class="queue-item" data-index="${index}">
                <div class="queue-item-header">
                    <span class="queue-item-name">${item.fileName}</span>
                    <span class="queue-item-status">${statusText}</span>
                </div>
                <div class="queue-progress">
                    <div class="queue-progress-fill" style="width: ${progress}%"></div>
                </div>
                ${status === 'pending' || status === 'error' ? `
                <div class="queue-item-actions">
                    <button class="queue-item-btn" onclick="removeFromQueue(${index})">🗑️ Kaldır</button>
                    ${status === 'pending' ? `<button class="queue-item-btn" onclick="uploadFromQueue(${index})">▶️ Yükle</button>` : ''}
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Remove from queue
window.removeFromQueue = function(index) {
    uploadQueue.splice(index, 1);
    updateQueue();
};

// Upload specific item from queue
window.uploadFromQueue = function(index) {
    if (index >= 0 && index < uploadQueue.length) {
        processQueue();
    }
};

// Connect to FTP
connectBtn.addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('ftp-connect');
    
    if (result.success) {
        isConnected = true;
        statusDot.classList.add('connected');
        statusText.textContent = 'Bağlı';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
        loadRemoteFiles('/');
    } else {
        alert('Bağlantı hatası: ' + result.error);
    }
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
    isConnected = false;
    statusDot.classList.remove('connected');
    statusText.textContent = 'Bağlantı yok';
    connectBtn.style.display = 'inline-block';
    disconnectBtn.style.display = 'none';
    remoteFileList.innerHTML = '<div class="empty-state">Bağlanın</div>';
});

// Refresh local
refreshLocalBtn.addEventListener('click', () => {
    loadLocalFiles(currentLocalPath);
});

// Refresh remote
refreshRemoteBtn.addEventListener('click', () => {
    if (isConnected) {
        loadRemoteFiles(currentRemotePath);
    }
});

// Select folder
selectFolderBtn.addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('select-folder');
    if (result.success) {
        loadLocalFiles(result.folder);
    }
});

// Add files to queue
function addFilesToQueue(filePaths) {
    for (const filePath of filePaths) {
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        
        // Only add files, not directories
        if (stats.isFile()) {
            const fileName = require('path').basename(filePath);
            const remotePath = currentRemotePath === '/' ? `/${fileName}` : `${currentRemotePath}/${fileName}`;
            
            // Check if already in queue
            const exists = uploadQueue.some(item => item.localPath === filePath);
            if (!exists) {
                uploadQueue.push({
                    fileName: fileName,
                    localPath: filePath,
                    remotePath: remotePath,
                    progress: 0,
                    status: 'pending'
                });
            }
        }
    }
    updateQueue();
}

// Upload files
uploadBtn.addEventListener('click', async () => {
    if (!isConnected) {
        alert('Önce FTP\'ye bağlanın');
        return;
    }
    
    // Get selected local files
    const selected = Array.from(localFileList.querySelectorAll('.file-item.selected'));
    
    if (selected.length === 0) {
        // If no selection, ask user to select files
        const result = await ipcRenderer.invoke('select-files');
        if (result.success && result.files.length > 0) {
            addFilesToQueue(result.files);
            processQueue();
        }
    } else {
        // Upload selected files
        const filePaths = selected
            .map(item => item.dataset.path)
            .filter(path => {
                const fs = require('fs');
                return fs.statSync(path).isFile();
            });
        
        addFilesToQueue(filePaths);
        processQueue();
    }
});

// Drag & Drop support for local files
localFileList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    localFileList.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
});

localFileList.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    localFileList.style.backgroundColor = '';
});

localFileList.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    localFileList.style.backgroundColor = '';
    
    if (!isConnected) {
        alert('Önce FTP\'ye bağlanın');
        return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    const filePaths = files.map(file => file.path);
    
    addFilesToQueue(filePaths);
    processQueue();
});

// Drag & Drop support for remote panel (drop files here to upload)
remoteFileList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    remoteFileList.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
});

remoteFileList.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    remoteFileList.style.backgroundColor = '';
});

remoteFileList.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    remoteFileList.style.backgroundColor = '';
    
    if (!isConnected) {
        alert('Önce FTP\'ye bağlanın');
        return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    const filePaths = files.map(file => file.path);
    
    addFilesToQueue(filePaths);
    processQueue();
});

// Double-click to add to queue (local files)
localFileList.addEventListener('dblclick', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (fileItem && fileItem.dataset.type === 'file') {
        if (!isConnected) {
            alert('Önce FTP\'ye bağlanın');
            return;
        }
        
        const filePath = fileItem.dataset.path;
        addFilesToQueue([filePath]);
        processQueue();
    }
});

// Right-click context menu (local files)
localFileList.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const fileItem = e.target.closest('.file-item');
    if (fileItem && fileItem.dataset.type === 'file') {
        // Select the file
        localFileList.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
        fileItem.classList.add('selected');
        
        // Show context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.style.background = 'var(--bg-tertiary)';
        menu.style.border = '1px solid var(--border)';
        menu.style.borderRadius = '6px';
        menu.style.padding = '5px 0';
        menu.style.zIndex = '1000';
        menu.style.minWidth = '150px';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        
        menu.innerHTML = `
            <div class="context-menu-item" data-action="add-to-queue">📤 Kuyruğa Ekle</div>
            <div class="context-menu-item" data-action="add-to-queue-and-upload">🚀 Kuyruğa Ekle ve Yükle</div>
        `;
        
        document.body.appendChild(menu);
        
        // Handle menu clicks
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const filePath = fileItem.dataset.path;
                
                if (action === 'add-to-queue' || action === 'add-to-queue-and-upload') {
                    if (!isConnected) {
                        alert('Önce FTP\'ye bağlanın');
                        document.body.removeChild(menu);
                        return;
                    }
                    
                    addFilesToQueue([filePath]);
                    
                    if (action === 'add-to-queue-and-upload') {
                        processQueue();
                    }
                }
                
                document.body.removeChild(menu);
            });
        });
        
        // Remove menu on outside click
        setTimeout(() => {
            const removeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    document.body.removeChild(menu);
                    document.removeEventListener('click', removeMenu);
                }
            };
            document.addEventListener('click', removeMenu);
        }, 100);
    }
});

// Listen for upload progress updates
ipcRenderer.on('upload-progress', (event, data) => {
    const { remotePath, progress } = data;
    const item = uploadQueue.find(q => q.remotePath === remotePath);
    if (item) {
        item.progress = progress;
        updateQueue();
    }
});

// Process upload queue
async function processQueue() {
    for (let i = 0; i < uploadQueue.length; i++) {
        const item = uploadQueue[i];
        if (item.status === 'pending' || item.status === 'uploading') {
            item.status = 'uploading';
            item.progress = 0;
            updateQueue();
            
            try {
                const result = await ipcRenderer.invoke('ftp-upload', item.localPath, item.remotePath);
                
                if (result.success) {
                    item.status = 'completed';
                    item.progress = 100;
                } else {
                    item.status = 'error: ' + result.error;
                }
            } catch (error) {
                item.status = 'error: ' + error.message;
            }
            
            updateQueue();
            
            // Remove completed items after 3 seconds
            if (item.status === 'completed') {
                setTimeout(() => {
                    const index = uploadQueue.indexOf(item);
                    if (index > -1) {
                        uploadQueue.splice(index, 1);
                        updateQueue();
                    }
                }, 3000);
            }
        }
    }
}

// New folder
newFolderBtn.addEventListener('click', async () => {
    if (!isConnected) {
        alert('Önce FTP\'ye bağlanın');
        return;
    }
    
    const folderName = prompt('Klasör adı:');
    if (folderName) {
        const remotePath = currentRemotePath === '/' ? `/${folderName}` : `${currentRemotePath}/${folderName}`;
        const result = await ipcRenderer.invoke('ftp-mkdir', remotePath);
        
        if (result.success) {
            loadRemoteFiles(currentRemotePath);
        } else {
            alert('Hata: ' + result.error);
        }
    }
});

// Clear queue
clearQueueBtn.addEventListener('click', () => {
    if (confirm('Kuyruğu temizlemek istediğinize emin misiniz?')) {
        uploadQueue = uploadQueue.filter(item => item.status === 'uploading');
        updateQueue();
    }
});

// Start queue
const startQueueBtn = document.getElementById('startQueueBtn');
startQueueBtn.addEventListener('click', () => {
    if (!isConnected) {
        alert('Önce FTP\'ye bağlanın');
        return;
    }
    processQueue();
});

// Initialize
loadLocalFiles(currentLocalPath);

