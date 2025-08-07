
// src/components/layout/Footer.jsx

import React from 'react';

/**
 * Application footer component
 */
export const Footer = () => (
  <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mt-16 lg:mt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center text-gray-600 dark:text-gray-400">
        <p className="text-sm">
          Built with React + Tailwind CSS v4 • Powered by Azure Cognitive Services
        </p>
      </div>
    </div>
  </footer>
);
