
// src/components/image/TextDetection.jsx

import React from 'react';
import { FileText } from 'lucide-react';
import { ResultCard } from './ResultCard.jsx';
import { extractTextContent } from '../../utils/formatters.js';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Component for displaying detected text
 * @param {object} props - Component props
 * @param {string|object|array} props.text - Detected text data
 */
export const TextDetection = ({ text }) => {
  const textContent = extractTextContent(text);
  
  return (
    <ResultCard 
      icon={FileText} 
      title="Detected Text" 
      gradient={UI_CONSTANTS.GRADIENTS.ORANGE}
    >
      {textContent ? (
        <div className="space-y-3">
          {typeof textContent === 'string' ? (
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-mono bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              {textContent}
            </p>
          ) : Array.isArray(textContent) ? (
            <div className="space-y-2">
              {textContent.map((textItem, index) => (
                <p key={index} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-mono bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  {textItem}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              {UI_CONSTANTS.MESSAGES.NO_TEXT}
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">
          {UI_CONSTANTS.MESSAGES.NO_TEXT}
        </p>
      )}
    </ResultCard>
  );
};