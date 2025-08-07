// src/components/image/ResultsViewer.jsx

import React from 'react';
import { CheckCircle, Image } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { ObjectDetection } from './ObjectDetection.jsx';
import { FaceAnalysis } from './FaceAnalysis.jsx';
import { DescriptionTags } from './DescriptionTags.jsx';
import { TextDetection } from './TextDetection.jsx';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Component for displaying complete analysis results
 * @param {object} props - Component props
 * @param {object} props.results - Analysis results
 * @param {File} props.uploadedImage - Original uploaded image file
 */
export const ResultsViewer = ({ results, uploadedImage }) => {
  const { analysis } = results;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Success Message */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        <p className="text-green-700 dark:text-green-300 font-medium">
          {UI_CONSTANTS.MESSAGES.ANALYSIS_COMPLETE}
        </p>
      </div>

      {/* Image Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Image className="w-5 h-5" />
          <span>Uploaded Image</span>
        </h3>
        <div className="flex justify-center">
          <img 
            src={URL.createObjectURL(uploadedImage)} 
            alt="Uploaded" 
            className="max-w-full max-h-64 rounded-lg shadow-sm object-contain"
          />
        </div>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ObjectDetection objects={analysis.objects} />
        <FaceAnalysis faces={analysis.faces} />
        <DescriptionTags 
          description={analysis.description} 
          tags={analysis.tags} 
        />
        <TextDetection text={analysis.text} />
      </div>
    </div>
  );
};