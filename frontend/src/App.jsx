import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Loader from './components/Loader';
import './App.css';

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'loading' | 'workspace'
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);

  const handleSelectDocument = (docId) => {
    setSelectedDocId(docId);
    setView('workspace');
  };

  const handleStartUpload = (file) => {
    setFileToUpload(file);
    setView('loading');
  };

  const handleBackToLanding = () => {
    setSelectedDocId(null);
    setFileToUpload(null);
    setView('landing');
  };

  const handleUploadComplete = (docId) => {
    setSelectedDocId(docId);
    setView('workspace');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 select-none">
      {view === 'landing' && (
        <LandingPage 
          onSelectDocument={handleSelectDocument}
          onStartUpload={handleStartUpload}
        />
      )}

      {view === 'loading' && (
        <Loader 
          documentId={selectedDocId}
          file={fileToUpload}
          onComplete={handleUploadComplete}
          onCancel={handleBackToLanding}
        />
      )}

      {view === 'workspace' && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
          <p className="text-lg font-medium text-slate-800 mb-4">Workspace placeholder for Document: {selectedDocId}</p>
          <button 
            onClick={handleBackToLanding}
            className="px-4 py-2 bg-slate-950 text-white rounded-md text-sm font-semibold"
          >
            Back to landing
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
