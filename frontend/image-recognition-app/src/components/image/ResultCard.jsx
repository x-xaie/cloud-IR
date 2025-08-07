// src/components/image/ResultCard.jsx

import React from 'react';
import { Card } from '../ui/Card.jsx';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Reusable card component for displaying analysis results
 * @param {object} props - Component props
 * @param {React.Component} props.icon - Icon component
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.gradient - Gradient class name
 */
export const ResultCard = ({ icon: Icon, title, children, gradient }) => (
  <Card className="overflow-hidden">
    <div className={`p-4 bg-gradient-to-r ${gradient} text-white`}>
      <div className="flex items-center space-x-3">
        <Icon className="w-6 h-6" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </Card>
);