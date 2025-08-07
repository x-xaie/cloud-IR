// src/utils/formatters.js

/**
 * Formats confidence score as percentage
 * @param {number} confidence - Confidence score (0-1)
 * @returns {number} Percentage (0-100)
 */
export const formatConfidencePercentage = (confidence) => {
  return Math.round((confidence || 0) * 100);
};

/**
 * Formats face count text
 * @param {number} count - Number of faces
 * @returns {string} Formatted text
 */
export const formatFaceCount = (count) => {
  return `${count} face${count !== 1 ? 's' : ''} detected`;
};

/**
 * Extracts text content from various text analysis formats
 * @param {string|object|array} textData - Text data from analysis
 * @returns {string|array} Formatted text content
 */
export const extractTextContent = (textData) => {
  if (!textData) return null;
  
  if (typeof textData === 'string') {
    return textData;
  }
  
  if (textData.text) {
    return textData.text;
  }
  
  if (Array.isArray(textData)) {
    return textData.map(item => 
      typeof item === 'string' ? item : item.text || item
    );
  }
  
  return null;
};