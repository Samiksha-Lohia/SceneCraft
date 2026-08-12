import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AuthModal from './AuthModal';
import lostInABookImg from '../assets/Lost_in_a_Book-removebg-preview.png';
import doodle1 from '../assets/00371261227346a59bdb24adc0932063-removebg-preview.png';
import doodle2 from '../assets/146e1e1cb5b63457348ee9e19be589c6-removebg-preview.png';
import doodle3 from '../assets/9d261ec3344c8925537fae690a9c8c4b-removebg-preview.png';
import doodle4 from '../assets/d0f01b872f5c3ada81d7b52897de0387-removebg-preview.png';
import doodle5 from '../assets/download__1_-removebg-preview.png';
import { 
  Sparkles, 
  Upload, 
  BookOpen, 
  Book,
  LogOut, 
  FileText,
  PenLine,
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
      
      {/* Background Random Doodles */}
<div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">

  {/* Flower — top left */}
  <img
    src={doodle1}
    alt=""
    className="absolute top-[12%] left-[5%] w-[62px] h-[62px] object-contain rotate-[12deg] opacity-20"
  />

  {/* Star — left middle */}
  <img
    src={doodle4}
    alt=""
    className="absolute top-[31%] left-[2%] w-[72px] h-[72px] object-contain rotate-[-15deg] opacity-20"
  />

  {/* Star — bottom left */}
  <img
    src={doodle4}
    alt=""
    className="absolute bottom-[25%] left-[4%] w-[56px] h-[56px] object-contain rotate-[8deg] opacity-20"
  />

  {/* Notebook — bottom left */}
  <img
    src={doodle5}
    alt=""
    className="absolute bottom-[4%] left-[9%] w-[90px] h-[90px] object-contain rotate-[-12deg] opacity-20"
  />

  {/* Camera — upper center-left */}
  <img
    src={doodle2}
    alt=""
    className="absolute top-[10%] left-[29%] w-[100px] h-[100px] object-contain rotate-[-8deg] opacity-20"
  />

  {/* Star — upper center */}
  <img
    src={doodle4}
    alt=""
    className="absolute top-[7%] left-[47%] w-[76px] h-[76px] object-contain rotate-[10deg] opacity-20"
  />

  {/* Notebook — upper center-right */}
  <img
    src={doodle5}
    alt=""
    className="absolute top-[5%] left-[59%] w-[72px] h-[72px] object-contain rotate-[-20deg] opacity-20"
  />

  {/* Notebook — upper right */}
  <img
    src={doodle5}
    alt=""
    className="absolute top-[11%] right-[3%] w-[95px] h-[95px] object-contain rotate-[12deg] opacity-20"
  />

  {/* Flower — center */}
  <img
    src={doodle1}
    alt=""
    className="absolute top-[29%] left-[57%] w-[78px] h-[78px] object-contain rotate-[5deg] opacity-20"
  />

  {/* Camera — right middle */}
  <img
    src={doodle2}
    alt=""
    className="absolute top-[35%] right-[10%] w-[95px] h-[95px] object-contain rotate-[-12deg] opacity-20"
  />

  {/* Star — right middle */}
  <img
    src={doodle4}
    alt=""
    className="absolute top-[52%] right-[3%] w-[70px] h-[70px] object-contain rotate-[8deg] opacity-20"
  />

  {/* Notebook — center bottom */}
  <img
    src={doodle5}
    alt=""
    className="absolute bottom-[22%] left-[41%] w-[76px] h-[76px] object-contain rotate-[-8deg] opacity-20"
  />

  {/* Camera — bottom center */}
  <img
    src={doodle2}
    alt=""
    className="absolute bottom-[5%] left-[51%] w-[90px] h-[90px] object-contain rotate-[-10deg] opacity-20"
  />

  {/* Flower — bottom right */}
  <img
    src={doodle1}
    alt=""
    className="absolute bottom-[8%] right-[17%] w-[78px] h-[78px] object-contain rotate-[8deg] opacity-20"
  />

  {/* Notebook — bottom right */}
  <img
    src={doodle5}
    alt=""
    className="absolute bottom-[7%] right-[4%] w-[82px] h-[82px] object-contain rotate-[15deg] opacity-20"
  />

  {/* Small star — near illustration */}
  <img
    src={doodle4}
    alt=""
    className="absolute top-[21%] left-[75%] w-[62px] h-[62px] object-contain rotate-[15deg] opacity-20"
  />

</div>
      
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 cursor-pointer">
          <PenLine className="w-6 h-6 text-slate-900" />
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
              className="px-5 py-2.5 bg-purple-200 hover:bg-purple-300 text-slate-900 border border-slate-900 rounded-full text-sm font-semibold shadow-[2px_2px_0px_#0f172a] hover:shadow-[3px_3px_0px_#0f172a] hover:scale-105 active:scale-95 transition-all"
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
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-purple-200/70 -z-10 "></span>
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
              className="px-6 py-3.5 bg-purple-200 hover:bg-purple-300 text-slate-900 border border-slate-900 rounded-full text-sm font-semibold shadow-[2px_2px_0px_#0f172a] hover:shadow-[3px_3px_0px_#0f172a] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload your story
            </button>
            <button
              onClick={() => setIsFlowchartOpen(true)}
              className="px-6 py-3.5 bg-white border border-slate-900 text-slate-800 rounded-full text-sm font-semibold shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 hover:shadow-[3px_3px_0px_#0f172a] hover:scale-[1.02] active:scale-[0.98] transition-all"
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

            {/* Illustration Image */}
            <img 
                src={lostInABookImg} 
                alt="Lost in a Book" 
                className="absolute w-full h-full object-contain drop-shadow-2xl bottom-[17%] left-[-10%] scale-170 transition-transform duration-500 ease-out" 
              />
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
