// src/utils/constants.js

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: 'https://func-imagerecognition-centralcanada-prod-hjedbmc9e5gcf6df.canadacentral-01.azurewebsites.net',
  //BASE_URL: 'http://localhost:7071',
  ENDPOINTS: {
    UPLOAD: '/api/images/upload',
    ANALYZE: '/api/images/{imageId}/analyze',
  },
};

/**
 * File Validation Rules
 */
export const FILE_VALIDATION = {
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  MAX_SIZE: 4 * 1024 * 1024, // 4MB
  MAX_DIMENSIONS: 4000,
};

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  GRADIENTS: {
    BLUE_PURPLE: 'from-blue-500 to-purple-600',
    BLUE_PURPLE_HOVER: 'from-blue-700 to-purple-700',
    BLUE: 'from-blue-500 to-blue-600',
    PURPLE: 'from-purple-500 to-purple-600',
    GREEN: 'from-green-500 to-green-600',
    ORANGE: 'from-orange-500 to-orange-600',
  },
  MESSAGES: {
    UPLOAD_SUCCESS: 'Image uploaded successfully!',
    ANALYSIS_COMPLETE: 'Image analysis completed successfully!',
    UPLOAD_INSTRUCTIONS: 'Drag and drop your image here, or click to browse',
    NO_OBJECTS: 'No objects detected',
    NO_FACES: 'No faces detected',
    NO_TEXT: 'No text detected',
    NO_DESCRIPTION: 'No description or tags available',
  },
  FILE_REQUIREMENTS: [
    '• Supported formats: JPG, PNG',
    '• Maximum size: 4MB',
    '• Maximum dimensions: 4000×4000px',
  ],
};