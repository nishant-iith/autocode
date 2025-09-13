import path from 'path';
import fs from 'fs-extra';

/**
 * Security utility functions to prevent directory traversal and other attacks
 */

/**
 * Validates workspace ID to prevent path traversal
 * @param {string} workspaceId - The workspace ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidWorkspaceId(workspaceId) {
  // UUID format validation (basic)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof workspaceId === 'string' && 
         workspaceId.length > 0 && 
         uuidRegex.test(workspaceId) &&
         !workspaceId.includes('..') &&
         !workspaceId.includes('/') &&
         !workspaceId.includes('\\');
}

/**
 * Validates and sanitizes file paths to prevent directory traversal
 * @param {string} filePath - The file path to validate
 * @returns {string|null} - Sanitized path or null if invalid
 */
export function sanitizeFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // Normalize the path to resolve any .. sequences
  const normalizedPath = path.normalize(filePath);
  
  // Check for directory traversal attempts
  if (normalizedPath.includes('..') || 
      normalizedPath.startsWith('/') || 
      normalizedPath.startsWith('\\') ||
      path.isAbsolute(normalizedPath)) {
    return null;
  }

  return normalizedPath;
}

/**
 * Safely constructs a path within the workspace directory
 * @param {string} workspacesDir - Base workspaces directory
 * @param {string} workspaceId - Workspace ID
 * @param {string} filePath - Optional file path within workspace
 * @returns {string|null} - Safe path or null if invalid
 */
export function getSecurePath(workspacesDir, workspaceId, filePath = '') {
  if (!isValidWorkspaceId(workspaceId)) {
    return null;
  }

  const sanitizedFilePath = filePath ? sanitizeFilePath(filePath) : '';
  if (filePath && !sanitizedFilePath) {
    return null;
  }

  const workspacePath = path.join(workspacesDir, workspaceId);
  const fullPath = sanitizedFilePath ? path.join(workspacePath, sanitizedFilePath) : workspacePath;
  
  // Final check: ensure the resolved path is still within the workspace
  const resolvedPath = path.resolve(fullPath);
  const resolvedWorkspacePath = path.resolve(workspacePath);
  
  if (!resolvedPath.startsWith(resolvedWorkspacePath)) {
    return null;
  }

  return fullPath;
}

/**
 * Validates file size to prevent large file uploads
 * @param {string} filePath - Path to the file
 * @param {number} maxSizeBytes - Maximum allowed size in bytes (default 10MB)
 * @returns {Promise<boolean>} - True if file size is acceptable
 */
export async function validateFileSize(filePath, maxSizeBytes = 10 * 1024 * 1024) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size <= maxSizeBytes;
  } catch (error) {
    return false;
  }
}

/**
 * Validates file type based on extension
 * @param {string} fileName - Name of the file
 * @param {string[]} allowedExtensions - Array of allowed extensions (with dots)
 * @returns {boolean} - True if file type is allowed
 */
export function validateFileType(fileName, allowedExtensions = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
  '.css', '.scss', '.less', '.html', '.xml', '.svg', '.env', '.gitignore',
  '.py', '.java', '.cpp', '.c', '.h', '.go', '.rs', '.php', '.rb', '.sh'
]) {
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext) || ext === '';
}