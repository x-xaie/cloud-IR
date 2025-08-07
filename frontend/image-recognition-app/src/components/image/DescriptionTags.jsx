
// src/components/image/DescriptionTags.jsx

import React from 'react';
import { Tag } from 'lucide-react';
import { ResultCard } from './ResultCard.jsx';
import { Badge } from '../ui/Badge.jsx';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Component for displaying image description and tags
 * @param {object} props - Component props
 * @param {string} props.description - Image description
 * @param {Array} props.tags - Image tags array
 */
export const DescriptionTags = ({ description, tags }) => (
  <ResultCard 
    icon={Tag} 
    title="Description & Tags" 
    gradient={UI_CONSTANTS.GRADIENTS.GREEN}
  >
    <div className="space-y-4">
      {description && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description:</h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      )}
      
      {tags && tags.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags:</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="green">
                {typeof tag === 'string' ? tag : tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {(!description && (!tags || tags.length === 0)) && (
        <p className="text-gray-500 dark:text-gray-400 italic">
          {UI_CONSTANTS.MESSAGES.NO_DESCRIPTION}
        </p>
      )}
    </div>
  </ResultCard>
);
