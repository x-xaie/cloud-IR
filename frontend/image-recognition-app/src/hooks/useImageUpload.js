// src/hooks/useImageUpload.js

import { useState } from 'react';
import { uploadImage } from '../services/api.js';
import { validateFile } from '../utils/fileValidation.js';

/**
 * Custom hook for handling image upload functionality
 * @returns {object} Upload state and methods
 */
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (file, onSuccess) => {
    setError('');
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadImage(file);
      onSuccess(result.imageId, file);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const clearError = () => setError('');

  return {
    isUploading,
    error,
    handleUpload,
    clearError,
  };
};