
// src/components/image/FaceAnalysis.jsx

import React from 'react';
import { Users } from 'lucide-react';
import { ResultCard } from './ResultCard.jsx';
import { formatFaceCount } from '../../utils/formatters.js';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Component for displaying face analysis results
 * @param {object} props - Component props
 * @param {Array} props.faces - Detected faces array
 */
export const FaceAnalysis = ({ faces }) => (
  <ResultCard 
    icon={Users} 
    title="Face Analysis" 
    gradient={UI_CONSTANTS.GRADIENTS.PURPLE}
  >
    {faces && faces.length > 0 ? (
      <div className="space-y-4">
        {faces.map((face, index) => (
          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="space-y-2 text-sm">
              {face.age && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Age:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{face.age}</span>
                </div>
              )}
              {face.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{face.gender}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatFaceCount(faces.length)}
        </p>
      </div>
    ) : (
      <p className="text-gray-500 dark:text-gray-400 italic">
        {UI_CONSTANTS.MESSAGES.NO_FACES}
      </p>
    )}
  </ResultCard>
);
