import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Loader from './components/Loader';
import Workspace from './components/Workspace';
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
        <Workspace 
          documentId={selectedDocId}
          onBack={handleBackToLanding}
        />
      )}
    </div>
  );
}

export default App;
