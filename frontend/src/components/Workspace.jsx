import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import OverviewTab from './OverviewTab';
// We'll import other tabs as they are created
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  GitFork, 
  Clock, 
  BarChart2, 
  ShieldAlert, 
  Search,
  Edit2,
  Check,
  LayoutDashboard
} from 'lucide-react';

export default function Workspace({ documentId, onBack }) {
  const [doc, setDoc] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'scenes' | 'characters' | 'relationships' | 'timeline' | 'arc' | 'continuity'

  useEffect(() => {
    loadDoc();
  }, [documentId]);

  const loadDoc = async () => {
    try {
      const data = await api.documents.getById(documentId);
      setDoc(data);
      setEditedTitle(data.title);
    } catch (err) {
      console.error('Failed to load document info:', err);
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || editedTitle === doc.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const updated = await api.documents.updateTitle(documentId, editedTitle);
      setDoc(prev => ({ ...prev, title: updated.title }));
      setIsEditingTitle(false);
    } catch (err) {
      alert(`Failed to update title: ${err.message}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'scenes', label: 'Scenes Explorer', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" /> },
    { id: 'relationships', label: 'Relationships', icon: <GitFork className="w-4 h-4" /> },
    { id: 'timeline', label: 'Story Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'arc', label: 'Story Arc', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'continuity', label: 'Continuity', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Workspace Header */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4 max-w-[60%]">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
            title="Back to library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 overflow-hidden">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  onBlur={handleSaveTitle}
                  autoFocus
                  className="px-2 py-1 border border-slate-300 rounded-md text-lg font-serif font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
                <button onClick={handleSaveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded-md">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                <h1 className="text-xl font-serif font-bold text-slate-950 truncate max-w-[400px]">
                  {doc?.title || 'Loading Story...'}
                </h1>
                <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] uppercase font-semibold">
              {doc?.fileType}
            </span>
          </div>
        </div>

        {/* Global Semantic Search Trigger/Input */}
        <div className="relative w-64 md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search story..."
            onClick={() => setActiveTab('search')} // Redirect or trigger search
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-transparent transition-all"
          />
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">Notebook Tabs</p>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-950 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom user card or badge */}
          <div className="p-3 border-t border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-xs text-purple-700">
              SC
            </div>
            <div className="text-left overflow-hidden">
              <span className="block text-xs font-semibold text-slate-700 truncate">{doc?.title}</span>
              <span className="block text-[10px] text-slate-400 uppercase font-mono">{doc?.wordCount || 0} words</span>
            </div>
          </div>
        </aside>

        {/* Content Sheet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fafbfc] relative">
          {/* Subtle Page line overlay to simulate notebook paper */}
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && <OverviewTab documentId={documentId} />}
            {activeTab === 'scenes' && <div className="text-center py-12 text-slate-400">Scenes Explorer coming in Phase 4</div>}
            {activeTab === 'characters' && <div className="text-center py-12 text-slate-400">Characters Profile coming in Phase 4</div>}
            {activeTab === 'relationships' && <div className="text-center py-12 text-slate-400">Relationship Graph coming in Phase 5</div>}
            {activeTab === 'timeline' && <div className="text-center py-12 text-slate-400">Timeline coming in Phase 5</div>}
            {activeTab === 'arc' && <div className="text-center py-12 text-slate-400">Story Arc coming in Phase 5</div>}
            {activeTab === 'continuity' && <div className="text-center py-12 text-slate-400">Continuity Checker coming in Phase 6</div>}
            {activeTab === 'search' && <div className="text-center py-12 text-slate-400">Semantic Search coming in Phase 6</div>}
          </div>
        </main>

      </div>
    </div>
  );
}
