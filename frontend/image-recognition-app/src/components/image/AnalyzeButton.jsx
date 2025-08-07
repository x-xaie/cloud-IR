// src/components/image/AnalyzeButton.jsx

import React from 'react';
import { Eye } from 'lucide-react';
import { useImageAnalysis } from '../../hooks/useImageAnalysis.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';
import { ErrorAlert } from '../ui/ErrorAlert.jsx';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Button component to trigger image analysis
 * @param {object} props - Component props
 * @param {string} props.imageId - ID of uploaded image
 * @param {function} props.onAnalysisComplete - Analysis completion callback
 */
export const AnalyzeButton = ({ imageId, onAnalysisComplete }) => {
  const { isAnalyzing, error, handleAnalysis, clearError } = useImageAnalysis();

  const onAnalyze = async () => {
    clearError();
    await handleAnalysis(imageId, onAnalysisComplete);
  };

  return (
    <div className="text-center space-y-4">
      <button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className={`px-8 py-4 bg-gradient-to-r ${UI_CONSTANTS.GRADIENTS.BLUE_PURPLE} hover:${UI_CONSTANTS.GRADIENTS.BLUE_PURPLE_HOVER} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-3 mx-auto`}
      >
        {isAnalyzing ? (
          <LoadingSpinner className="text-white" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
        <span>{isAnalyzing ? 'Analyzing Image...' : 'Analyze Image'}</span>
      </button>
      
      {error && (
        <div className="max-w-md mx-auto">
          <ErrorAlert message={error} />
        </div>
      )}
    </div>
  );
};