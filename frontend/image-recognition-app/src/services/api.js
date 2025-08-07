// src/services/api.js

import { API_CONFIG } from '../utils/constants.js';

/**
 * Generic API error handler
 * @param {Response} response - Fetch response
 * @param {string} operation - Operation name for error context
 */
const handleApiError = async (response, operation) => {
  if (!response.ok) {
    throw new Error(`${operation} failed: ${response.statusText}`);
  }
};

/**
 * Upload image to server
 * @param {File} file - Image file to upload
 * @returns {Promise<object>} Upload result with imageId
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
    method: 'POST',
    body: formData,
  });

  await handleApiError(response, 'Upload');
  return await response.json();
};

/**
 * Analyze uploaded image
 * @param {string} imageId - ID of uploaded image
 * @returns {Promise<object>} Analysis results
 */
export const analyzeImage = async (imageId) => {
  const endpoint = API_CONFIG.ENDPOINTS.ANALYZE.replace('{imageId}', imageId);
  
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  await handleApiError(response, 'Analysis');
  return await response.json();
};