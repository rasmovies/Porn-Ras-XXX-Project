const path = require('path');

/**
 * Sanitize and validate file paths to prevent Path Traversal attacks
 * @param {string} filePath - The file path to sanitize
 * @param {string} baseDir - The base directory (e.g., '/tmp')
 * @returns {string|null} - Sanitized absolute path or null if invalid
 */
function sanitizePath(filePath, baseDir) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // Remove null bytes and other dangerous characters
  let sanitized = filePath
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();

  // Normalize the path (resolve .. and .)
  sanitized = path.normalize(sanitized);

  // Resolve to absolute path within baseDir
  const resolvedPath = path.resolve(baseDir, sanitized);

  // Ensure the resolved path is within baseDir (prevent directory traversal)
  const baseDirResolved = path.resolve(baseDir);
  if (!resolvedPath.startsWith(baseDirResolved)) {
    console.warn(`⚠️ Path Traversal attempt blocked: ${filePath} -> ${resolvedPath}`);
    return null;
  }

  return resolvedPath;
}

/**
 * Sanitize filename (remove path separators and dangerous characters)
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[\/\\]/g, '_') // Replace path separators
    .replace(/\.\./g, '_') // Replace parent directory references
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>:"|?*]/g, '_') // Remove Windows reserved characters
    .trim();

  // Limit filename length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }

  // Ensure filename is not empty
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    sanitized = 'unnamed';
  }

  return sanitized;
}

/**
 * Validate that a path is safe for file operations
 * @param {string} filePath - The file path to validate
 * @param {string} baseDir - The base directory
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(filePath, baseDir) {
  const sanitized = sanitizePath(filePath, baseDir);
  return sanitized !== null;
}

module.exports = {
  sanitizePath,
  sanitizeFilename,
  isPathSafe
};

