// src/components/image/ImageUpload.jsx

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';
import { ErrorAlert } from '../ui/ErrorAlert.jsx';
import { UI_CONSTANTS } from '../../utils/constants.js';

/**
 * Image upload component with drag & drop functionality
 * @param {object} props - Component props
 * @param {function} props.onUploadSuccess - Success callback
 */
export const ImageUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const { isUploading, error, handleUpload, clearError } = useImageUpload();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    clearError();
    await handleUpload(file, onUploadSuccess);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${UI_CONSTANTS.GRADIENTS.BLUE_PURPLE} rounded-full flex items-center justify-center`}>
            {isUploading ? (
              <LoadingSpinner size="w-8 h-8" className="text-white" />
            ) : (
              <Upload className="w-8 h-8 text-white" />
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isUploading ? 'Uploading...' : 'Upload Your Image'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {UI_CONSTANTS.MESSAGES.UPLOAD_INSTRUCTIONS}
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              {UI_CONSTANTS.FILE_REQUIREMENTS.map((req, index) => (
                <p key={index}>{req}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {error && <ErrorAlert message={error} />}
    </div>
  );
};