// src/hooks/useImageAnalysis.js

import { useState } from 'react';
import { analyzeImage } from '../services/api.js';

/**
 * Custom hook for handling image analysis functionality
 * @returns {object} Analysis state and methods
 */
export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalysis = async (imageId, onSuccess) => {
    setError('');
    setIsAnalyzing(true);

    try {
      const results = await analyzeImage(imageId);
      onSuccess(results);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearError = () => setError('');

  return {
    isAnalyzing,
    error,
    handleAnalysis,
    clearError,
  };
};