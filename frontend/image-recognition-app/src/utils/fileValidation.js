// src/utils/fileValidation.js

import { FILE_VALIDATION } from './constants.js';

/**
 * Validates uploaded file against size and type requirements
 * @param {File} file - The file to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateFile = (file) => {
  if (!file) {
    return 'No file provided';
  }

  // Check file type
  if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPG and PNG files are allowed';
  }

  // Check file size
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return 'File size must be less than 4MB';
  }

  return null;
};