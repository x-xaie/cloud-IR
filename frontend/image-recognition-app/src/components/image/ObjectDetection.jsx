
// src/components/image/ObjectDetection.jsx

import React from 'react';
import { Camera } from 'lucide-react';
import { ResultCard } from './ResultCard.jsx';
import { ConfidenceBar } from '../ui/ConfidenceBar.jsx';
import { formatConfidencePercentage } from '../../utils/formatters.js';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Component for displaying object detection results
 * @param {object} props - Component props
 * @param {Array} props.objects - Detected objects array
 */
export const ObjectDetection = ({ objects }) => (
  <ResultCard 
    icon={Camera} 
    title="Objects Detected" 
    gradient={UI_CONSTANTS.GRADIENTS.BLUE}
  >
    {objects && objects.length > 0 ? (
      <div className="space-y-4">
        {objects.map((obj, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {obj.name || obj.object}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatConfidencePercentage(obj.confidence)}%
              </span>
            </div>
            <ConfidenceBar confidence={obj.confidence || 0} />
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 dark:text-gray-400 italic">
        {UI_CONSTANTS.MESSAGES.NO_OBJECTS}
      </p>
    )}
  </ResultCard>
);
