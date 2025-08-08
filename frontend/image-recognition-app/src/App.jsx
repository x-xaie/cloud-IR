import React, { useState } from 'react';
import { Header } from './components/layout/Header.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { PageSection } from './components/layout/PageSection.jsx';
import { ImageUpload } from './components/image/ImageUpload.jsx';
import { AnalyzeButton } from './components/image/AnalyzeButton.jsx';
import { ResultsViewer } from './components/image/ResultsViewer.jsx';
import { HealthDashboardModal } from './components/health/HealthDashboardModal.jsx';

/**
 * Main application component with organized structure
 */
const App = () => {
  const [imageId, setImageId] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [isHealthDashboardOpen, setIsHealthDashboardOpen] = useState(false);

  const handleUploadSuccess = (id, file) => {
    setImageId(id);
    setUploadedImage(file);
    setResults(null);
  };

  const handleAnalysisComplete = (analysisResults) => {
    setResults(analysisResults);
  };

  const resetApp = () => {
    setImageId(null);
    setUploadedImage(null);
    setResults(null);
  };

  const openHealthDashboard = () => {
    setIsHealthDashboardOpen(true);
  };

  const closeHealthDashboard = () => {
    setIsHealthDashboardOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header 
        onReset={resetApp}
        showResetButton={!!(imageId || results)}
        showHealthStatus={true}
        onHealthClick={openHealthDashboard}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="space-y-8 lg:space-y-12">
          {/* Step 1: Upload */}
          {!imageId && !results && (
            <PageSection>
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Upload an Image to Get Started
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                  Our AI will analyze your image and detect objects, faces, text, and provide detailed descriptions.
                </p>
              </div>
              <ImageUpload onUploadSuccess={handleUploadSuccess} />
            </PageSection>
          )}

          {/* Step 2: Analyze */}
          {imageId && !results && (
            <PageSection>
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Image Uploaded Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Click the button below to analyze your image with AI.
                </p>
              </div>
              
              {uploadedImage && (
                <div className="max-w-sm mx-auto">
                  <img 
                    src={URL.createObjectURL(uploadedImage)} 
                    alt="Uploaded preview" 
                    className="w-full rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
              
              <AnalyzeButton 
                imageId={imageId}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </PageSection>
          )}

          {/* Step 3: Results */}
          {results && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Analysis Results
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Here's what our AI found in your image:
                </p>
              </div>
              <ResultsViewer 
                results={results} 
                uploadedImage={uploadedImage}
                onViewAnalytics={openHealthDashboard}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Health Dashboard Modal - Rendered at App level */}
      <HealthDashboardModal 
        isOpen={isHealthDashboardOpen}
        onClose={closeHealthDashboard}
      />
    </div>
  );
};

export default App;