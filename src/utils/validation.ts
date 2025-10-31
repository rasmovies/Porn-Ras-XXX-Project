// File validation utilities

// Maximum file sizes (in bytes)
export const MAX_VIDEO_SIZE = 1024 * 1024 * 1024 * 5; // 5GB
export const MAX_IMAGE_SIZE = 1024 * 1024 * 5; // 5MB

// Allowed file types
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Sanitize string input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim();
};

// Validate video file
export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Geçersiz video formatı. İzin verilen formatlar: MP4, WebM, OGG, MOV, AVI, MKV`,
    };
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    const maxSizeGB = MAX_VIDEO_SIZE / (1024 * 1024 * 1024);
    return {
      valid: false,
      error: `Video dosyası çok büyük. Maksimum boyut: ${maxSizeGB}GB`,
    };
  }

  return { valid: true };
};

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Geçersiz resim formatı. İzin verilen formatlar: JPEG, PNG, WebP, GIF`,
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `Resim dosyası çok büyük. Maksimum boyut: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

// Validate URL
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Geçersiz URL formatı' };
  }
};

// Validate Streamtape URL
export const validateStreamtapeUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url.trim()) {
    return { valid: false, error: 'Streamtape URL gereklidir' };
  }

  if (!url.includes('streamtape.com')) {
    return { valid: false, error: 'Geçerli bir Streamtape URL\'si girin' };
  }

  return validateUrl(url);
};

// Validate title
export const validateTitle = (title: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(title);
  
  if (!sanitized.trim()) {
    return { valid: false, error: 'Video başlığı gereklidir' };
  }

  if (sanitized.length < 3) {
    return { valid: false, error: 'Video başlığı en az 3 karakter olmalıdır' };
  }

  if (sanitized.length > 200) {
    return { valid: false, error: 'Video başlığı en fazla 200 karakter olabilir' };
  }

  return { valid: true };
};

// Validate description
export const validateDescription = (description: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(description);
  
  if (sanitized.length > 5000) {
    return { valid: false, error: 'Açıklama en fazla 5000 karakter olabilir' };
  }

  return { valid: true };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};



