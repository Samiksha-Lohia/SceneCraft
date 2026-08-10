import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AuthModal from './AuthModal';
import { 
  Sparkles, 
  Upload, 
  BookOpen, 
  Book,
  LogOut, 
  FileText,
  Trash2,
  X
} from 'lucide-react';

export default function LandingPage({ onSelectDocument, onStartUpload }) {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFlowchartOpen, setIsFlowchartOpen] = useState(false);
  const [authAction, setAuthAction] = useState('demo'); // 'demo' | 'upload'
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = api.auth.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      fetchDocuments();
    }
  };

  const fetchDocuments = async () => {
    try {
      const docs = await api.documents.list();
      setDocuments(docs || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleAuthSuccess = () => {
    checkUser();
    // If the action was demo, we can just trigger a demo load
    if (authAction === 'upload') {
      triggerFilePicker();
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setDocuments([]);
  };

  const triggerFilePicker = () => {
    if (!api.auth.isAuthenticated()) {
      setAuthAction('upload');
      setIsAuthOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onStartUpload(file);
    }
  };

  const handleTryDemo = async () => {
    if (!api.auth.isAuthenticated()) {
      setAuthAction('demo');
      setIsAuthOpen(true);
      return;
    }
    // If already logged in, see if we have documents, otherwise prompt upload
    if (documents.length > 0) {
      // Open the latest document
      onSelectDocument(documents[0].id);
    } else {
      triggerFilePicker();
    }
  };

  const handleDeleteDoc = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document and all its analysis data?')) {
      try {
        await api.documents.delete(id);
        fetchDocuments();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen notebook-grid flex flex-col relative overflow-x-hidden">
      
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 cursor-pointer">
          <BookOpen className="w-6 h-6 text-slate-900" />
          <span className="font-serif font-bold text-xl tracking-tight text-slate-900">SceneCraft</span>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-4 relative">
          {user ? (
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-xs">
              <span className="text-sm font-medium text-slate-700">Hello, {user.name}</span>
              
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-950 transition-colors"
                title="Manuscripts History"
              >
                {isHistoryOpen ? <BookOpen className="w-4 h-4 text-purple-600" /> : <Book className="w-4 h-4" />}
              </button>

              <button 
                onClick={handleLogout}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-950 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
              
              {/* History Dropdown Menu */}
              {isHistoryOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-100">
                    Analyzed Manuscripts ({documents.length})
                  </h3>
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No manuscripts analyzed yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setIsHistoryOpen(false);
                            onSelectDocument(doc.id);
                          }}
                          className="group flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100"
                        >
                          <div className="flex items-center gap-2 overflow-hidden text-left">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-950 group-hover:text-white transition-colors flex-shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                              <p className="text-[10px] text-slate-400 truncate uppercase">{doc.fileType} • {doc.wordCount || 0} words</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDoc(doc.id, e);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            title="Delete story"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleTryDemo}
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-sm font-semibold shadow-xs hover:scale-105 active:scale-95 transition-all"
            >
              Try the demo
            </button>
          )}
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col md:grid md:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left column info */}
        <div className="md:col-span-7 flex flex-col items-start text-left space-y-6 max-w-2xl">
          
          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-serif text-slate-950 leading-tight">
            Understand your story<br />
            <span className="relative inline-block mt-2">
              like never before.
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-purple-100/70 -z-10 rounded-sm"></span>
            </span>
          </h1>

          {/* Subtitle description */}
          <p className="text-lg text-slate-600 leading-relaxed">
            SceneCraft reads your script or novel and rebuilds it as a workspace — scenes, characters, timelines, relationships and continuity gaps you can actually click through.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.docx,.txt" 
              className="hidden" 
            />
            <button
              onClick={triggerFilePicker}
              className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload your story
            </button>
            <button
              onClick={() => setIsFlowchartOpen(true)}
              className="px-6 py-3.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-800 rounded-full text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              See how it works
            </button>
          </div>

          {/* Tagline below buttons */}
          <p className="font-handwriting text-2xl text-slate-500 pl-4 pt-1">
            Every story deserves more than a summary.
          </p>
        </div>

        {/* Right column illustration sketch */}
        <div className="md:col-span-5 w-full flex justify-center relative">
          
          {/* Sketch Drawing */}
          <div className="relative w-full max-w-md aspect-[1.1] select-none">
            {/* Sparkles background */}
            <div className="absolute -top-6 -right-6 text-yellow-500/40 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-6 -left-6 text-purple-500/20">
              <Sparkles className="w-12 h-12" />
            </div>

            {/* Custom SVG Notebook Illustration */}
            <svg 
              viewBox="0 0 500 450" 
              className="w-full h-full drop-shadow-xl filter"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back Page Shadow & Border */}
              <path d="M40 380 C 120 375, 220 375, 250 395 C 280 375, 380 375, 460 380 L 450 60 C 370 55, 280 55, 250 75 C 220 55, 130 55, 50 60 Z" fill="#fafafa" stroke="#e2e8f0" strokeWidth="4" />
              
              {/* Book Sheets Shadow */}
              <path d="M43 383 C 121 378, 220 378, 250 398 C 280 378, 379 378, 457 383 L 447 63 C 369 58, 280 58, 250 78 C 220 58, 131 58, 53 63 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              
              {/* Main Open Pages */}
              <path id="open-notebook" d="M45 385 C 122 380, 220 380, 250 400 C 280 380, 378 380, 455 385 L 445 65 C 368 60, 280 60, 250 80 C 220 60, 132 60, 55 65 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />

              {/* Binding Center line */}
              <path d="M250 80 L 250 400" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M250 76 C 250 76, 252 410, 254 415" stroke="#475569" strokeWidth="1.5" />
              
              {/* Left Page content (Text / Quill) */}
              {/* Lines */}
              <path d="M85 130 H 220" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M85 160 H 220" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M85 190 H 220" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M85 220 H 220" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M85 250 H 220" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M85 280 H 200" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M85 310 H 180" stroke="#e2e8f0" strokeWidth="2" />

              {/* Hand Drawn Sketched Text effect */}
              <path d="M90 125 C 100 120, 120 135, 135 125 C 150 115, 170 135, 190 125" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M90 155 C 110 150, 130 162, 150 155 C 170 148, 195 160, 210 155" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M90 185 C 105 180, 120 190, 145 185 C 165 180, 180 192, 205 185" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M90 215 C 100 210, 115 222, 130 215 C 145 208, 160 220, 185 215" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

              {/* Heart icon on top left page */}
              <path d="M100 95 C 95 85, 80 85, 80 95 C 80 105, 100 115, 100 115 C 100 115, 120 105, 120 95 C 120 85, 105 85, 100 95 Z" fill="none" stroke="#1e293b" strokeWidth="2" />

              {/* Right Page content (Character Network Graph) */}
              {/* Dotted Connections */}
              <path d="M300 130 L 370 110" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M370 110 L 410 160" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M410 160 L 370 230" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M370 230 L 300 230" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M300 230 L 300 130" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              
              {/* Central Character Node */}
              <path d="M350 170 L 300 130" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M350 170 L 370 110" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M350 170 L 410 160" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M350 170 L 370 230" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M350 170 L 300 230" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M350 170 L 350 280" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />

              {/* Node Circles */}
              {/* Protagonist (Center) */}
              <circle cx="350" cy="170" r="16" fill="#fef08a" stroke="#1e293b" strokeWidth="2" />
              {/* Profile icon details */}
              <circle cx="350" cy="166" r="5" fill="none" stroke="#1e293b" strokeWidth="1.5" />
              <path d="M342 178 C 342 173, 358 173, 358 178" fill="none" stroke="#1e293b" strokeWidth="1.5" />
              {/* Tiny heart badge on protagonist */}
              <path d="M358 162 C 357 160, 354 160, 354 162 C 354 164, 358 166, 358 166 C 358 166, 362 164, 362 162 C 362 160, 359 160, 358 162 Z" fill="#ef4444" />

              {/* Node 1 */}
              <circle cx="300" cy="130" r="12" fill="#fff" stroke="#1e293b" strokeWidth="2" />
              <circle cx="300" cy="127" r="4" fill="none" stroke="#1e293b" strokeWidth="1.2" />
              <path d="M294 136 C 294 132, 306 132, 306 136" fill="none" stroke="#1e293b" strokeWidth="1.2" />

              {/* Node 2 */}
              <circle cx="370" cy="110" r="12" fill="#fff" stroke="#1e293b" strokeWidth="2" />
              <circle cx="370" cy="107" r="4" fill="none" stroke="#1e293b" strokeWidth="1.2" />
              <path d="M364 116 C 364 112, 376 112, 376 116" fill="none" stroke="#1e293b" strokeWidth="1.2" />

              {/* Node 3 */}
              <circle cx="410" cy="160" r="12" fill="#fff" stroke="#1e293b" strokeWidth="2" />
              <circle cx="410" cy="157" r="4" fill="none" stroke="#1e293b" strokeWidth="1.2" />
              <path d="M404 166 C 404 162, 416 162, 416 166" fill="none" stroke="#1e293b" strokeWidth="1.2" />

              {/* Node 4 */}
              <circle cx="370" cy="230" r="12" fill="#fff" stroke="#1e293b" strokeWidth="2" />
              <circle cx="370" cy="227" r="4" fill="none" stroke="#1e293b" strokeWidth="1.2" />
              <path d="M364 236 C 364 232, 376 232, 376 236" fill="none" stroke="#1e293b" strokeWidth="1.2" />

              {/* Node 5 */}
              <circle cx="300" cy="230" r="12" fill="#fff" stroke="#1e293b" strokeWidth="2" />
              <circle cx="300" cy="227" r="4" fill="none" stroke="#1e293b" strokeWidth="1.2" />
              <path d="M294 236 C 294 232, 306 232, 306 236" fill="none" stroke="#1e293b" strokeWidth="1.2" />

              {/* Node 6 (Supporting) */}
              <circle cx="350" cy="280" r="10" fill="#fff" stroke="#1e293b" strokeWidth="2" />
              <circle cx="350" cy="277" r="3" fill="none" stroke="#1e293b" strokeWidth="1" />
              <path d="M345 284 C 345 281, 355 281, 355 284" fill="none" stroke="#1e293b" strokeWidth="1" />

              {/* Sparkle symbols around book */}
              <path d="M400 65 L 403 72 L 410 75 L 403 78 L 400 85 L 397 78 L 390 75 L 397 72 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <path d="M120 380 L 122 384 L 126 385 L 122 386 L 120 390 L 118 386 L 114 385 L 118 384 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <path d="M280 50 L 282 54 L 286 55 L 282 56 L 280 60 L 278 56 L 274 55 L 278 54 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />

              {/* Pen Sketch Lying Across page bottom right */}
              <g transform="translate(390, 240) rotate(50)">
                {/* Pen body */}
                <rect x="0" y="0" width="12" height="120" rx="3" fill="#0f172a" stroke="#fff" strokeWidth="1.5" />
                {/* Pen clip */}
                <rect x="3" y="15" width="2" height="35" fill="#f8fafc" />
                {/* Pen Tip gold */}
                <path d="M0 120 L 6 135 L 12 120 Z" fill="#fbbf24" stroke="#fff" strokeWidth="1" />
                {/* Fine nib */}
                <line x1="6" y1="135" x2="6" y2="128" stroke="#000" strokeWidth="2" />
              </g>
              
              {/* Bookmark Ribbon */}
              <path d="M246 397 L 246 430 L 252 422 L 258 430 L 258 397 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </main>

      {/* Flowchart Modal */}
      {isFlowchartOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 md:p-8 relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setIsFlowchartOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-left space-y-4 overflow-y-auto pr-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-bold text-slate-900">Analysis Pipeline Flowchart</h2>
                <p className="text-sm text-slate-500">Step-by-step overview of how SceneCraft processes your story.</p>
              </div>

              <div className="relative border-l-2 border-dashed border-slate-200 pl-6 ml-3 py-2 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-slate-800">1. Upload & Parsing</h4>
                  <p className="text-xs text-slate-500">Manuscript is parsed into plain structured text blocks (PDF, DOCX, TXT).</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-slate-800">2. Scene Segmentation</h4>
                  <p className="text-xs text-slate-500">AI segments the manuscript chronologically into narrative scenes.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-slate-800">3. Character Profiling</h4>
                  <p className="text-xs text-slate-500">AI extracts characters, maps aliases, details bios, and assigns roles.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-700 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-slate-800">4. Relationship Analysis</h4>
                  <p className="text-xs text-slate-500">AI analyzes interactions and sentiment dynamics between character pairs.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-600 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-slate-800">5. Timeline Reconstruction</h4>
                  <p className="text-xs text-slate-500">Events are chronologically ordered with exact timestamps/labels.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-slate-800">6. Mood & Tension Mapping</h4>
                  <p className="text-xs text-slate-500">Computes narrative arc tension and tracks primary mood tags per scene.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-slate-800">7. Continuity Check & Semantic Embeddings</h4>
                  <p className="text-xs text-slate-500">Finds plot holes or details mismatches, and builds vector hashes for semantic querying.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal overlay */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
