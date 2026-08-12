import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function Loader({ documentId, file, onComplete, onCancel }) {
  const [activeDocId, setActiveDocId] = useState(documentId);
  const [jobs, setJobs] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('Initializing upload...');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = React.useRef(null);


  // Books representation for the left-side animation
  // Reference stack (from bottom to top matching pipeline sequence)
  const initialBooks = [
    { id: 'embeddings', label: 'EMBEDDINGS', color: 'bg-indigo-50 border-slate-900 text-indigo-900', stage: 'embeddings' },
    { id: 'continuity', label: 'CONTINUITY', color: 'bg-teal-50 border-slate-900 text-teal-900', stage: 'continuity' },
    { id: 'arc', label: 'STORY ARC', color: 'bg-rose-50 border-slate-900 text-rose-900', stage: 'arc' },
    { id: 'mood', label: 'MOOD & TENSION', color: 'bg-orange-50 border-slate-900 text-orange-900', stage: 'mood' },
    { id: 'dialogue', label: 'DIALOGUE', color: 'bg-sky-50 border-slate-900 text-sky-900', stage: 'dialogue' },
    { id: 'timeline', label: 'TIMELINE', color: 'bg-amber-50 border-slate-900 text-amber-900', stage: 'timeline' },
    { id: 'relationships', label: 'RELATIONSHIPS', color: 'bg-red-50 border-slate-900 text-red-900', stage: 'relationships' },
    { id: 'characters', label: 'CHARACTERS', color: 'bg-emerald-50 border-slate-900 text-emerald-900', stage: 'characters' },
    { id: 'scenes', label: 'SCENES', color: 'bg-purple-50 border-slate-900 text-purple-900', stage: 'scenes' },
    { id: 'parsing', label: 'PARSING TEXT', color: 'bg-stone-100 border-slate-900 text-stone-900', stage: 'parsing' },
  ];

  const [activeBookIndex, setActiveBookIndex] = useState(0);

  // Poll for document processing status
  useEffect(() => {
    let uploadStarted = false;
    const abortController = new AbortController();

    const startProcessing = async () => {
      try {
        let docId = activeDocId;
        
        // If file is provided, upload it first
        if (file && (!docId || docId === 'null' || docId === 'undefined')) {
          setCurrentStageText('Uploading manuscript...');
          const uploadRes = await api.documents.upload(file);
          docId = uploadRes.id || uploadRes._id;
          setActiveDocId(docId);
        }

        if (!docId || docId === 'null' || docId === 'undefined') {
          throw new Error('No document ID or file provided.');
        }

        // Start polling jobs
        uploadStarted = true;

        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(() => {
          checkStatus(docId, abortController.signal);
        }, 3000);

        // Run initial check
        checkStatus(docId, abortController.signal);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setErrorMsg(err.message || 'Failed to upload document.');
          setLoading(false);
        }
      }
    };

    startProcessing();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      abortController.abort();
    };
  }, [activeDocId, file]);

  const checkStatus = async (docId, signal) => {
    try {
      const jobList = await api.jobs.getStatus(docId, signal);
      setJobs(jobList || []);

      // Calculate progress and determine current stage
      // Stages: parsing, scenes, characters, relationships, timeline, dialogue, mood, arc, continuity, embeddings
      const stageLabels = {
        parsing: 'Parsing document text',
        scenes: 'Performing scene breakdown',
        characters: 'Extracting character profiles',
        relationships: 'Generating character relationship graph',
        timeline: 'Reconstructing story timeline',
        dialogue: 'Analyzing dialogue patterns',
        mood: 'Scoring emotional scene mood',
        arc: 'Plotting narrative tension curve',
        continuity: 'Checking for continuity issues',
        embeddings: 'Indexing vector embeddings for search'
      };

      let completedCount = 0;
      let activeStage = null;
      let totalStages = jobList.length || 10;
      let failedStage = null;

      jobList.forEach(job => {
        if (job.status === 'completed') completedCount++;
        if (job.status === 'running') activeStage = job.stage;
        if (job.status === 'failed') failedStage = job;
      });

      // Simple progress calculation
      const progressPercent = Math.round((completedCount / totalStages) * 100);
      setOverallProgress(progressPercent);

      // Set the active book index to the number of completed jobs to trigger the landing puff particles
      setActiveBookIndex(completedCount);

      if (failedStage) {
        setCurrentStageText(`Failed during ${stageLabels[failedStage.stage] || failedStage.stage}`);
        setErrorMsg(failedStage.error || 'A processing pipeline job failed.');
        setLoading(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
      }

      if (activeStage) {
        setCurrentStageText(`${stageLabels[activeStage] || activeStage}...`);
      } else if (completedCount === totalStages && totalStages > 0) {
        setCurrentStageText('Story analysis complete!');
        setLoading(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        // Delay completion navigation slightly for visual satisfaction
        setTimeout(() => {
          onComplete(docId);
        }, 1500);
      } else {
        // Find first non-completed stage
        const nextJob = jobList.find(j => j.status !== 'completed');
        if (nextJob) {
          setCurrentStageText(`Queued: ${stageLabels[nextJob.stage] || nextJob.stage}`);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching jobs:', err);
      }
    }
  };

  const handleRetryStage = async (stage) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await api.jobs.retryStage(activeDocId, stage);
      checkStatus(activeDocId);
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen notebook-grid flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-8 md:p-16 flex flex-col md:grid md:grid-cols-12 gap-12 items-center relative">
        
        {/* Left Side: Stacking Book Animation */}
        <div className="md:col-span-6 w-full flex flex-col items-center justify-center min-h-[360px] relative">
          
          {/* Animated stack container */}
          <div className="relative flex flex-col items-center justify-end w-64 h-[320px] border-b-4 border-slate-900 pb-2">
            
            <AnimatePresence>
              {initialBooks.map((book, idx) => {
                // Determine if this book has fallen
                const isFallen = jobs.some(j => j.stage === book.stage && j.status === 'completed');
                
                if (!isFallen) return null;

                return (
                  <motion.div
                    key={book.id}
                    initial={{ y: -450, opacity: 0 }}
                    animate={{ 
                      y: 0, 
                      opacity: 1, 
                      rotate: idx % 2 === 0 ? 0.6 : -0.6,
                      scaleY: [1, 0.85, 1], // Squash effect on impact
                    }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 120, 
                      damping: 10,
                      delay: 0.05 
                    }}
                    className={`w-48 h-[26px] border-2 border-slate-900 rounded shadow-xs ${book.color} flex items-center justify-center font-bold text-[10px] tracking-wider mb-[-2px]`}
                  >
                    <span>{book.label}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Dust puff particles on book landing */}
            {activeBookIndex > 0 && activeBookIndex <= 10 && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                key={activeBookIndex}
                transition={{ duration: 0.4 }}
                className="absolute bottom-2 left-6 right-6 h-6 border-t-2 border-slate-300 rounded-full filter blur-xs -z-10"
              />
            )}
          </div>
          
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Incremental analysis stack
          </p>
        </div>

        {/* Right Side: Progress Bar and Info */}
        <div className="md:col-span-6 w-full text-left space-y-6">
          {/* Logo quill banner */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-900 fill-none stroke-current" strokeWidth="2">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
            <div className="text-left">
              <h2 className="font-serif font-bold text-2xl text-slate-900 leading-none">SceneCraft</h2>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">AI Story Analysis</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span className="truncate max-w-[80%]">{currentStageText}</span>
              <span className="font-mono">{overallProgress}%</span>
            </div>
            
            {/* Main Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div
                className="h-full bg-purple-600 rounded-full"
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Detailed list of pipeline stages */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
            {jobs.map((job) => (
              <div key={job.stage} className="flex items-center justify-between text-xs">
                <span className="capitalize font-medium text-slate-600">{job.stage} analysis</span>
                <div className="flex items-center gap-1.5">
                  {job.status === 'completed' && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                  {job.status === 'running' && (
                    <span className="flex items-center gap-1 text-purple-600 font-semibold animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing ({job.progress}%)
                    </span>
                  )}
                  {job.status === 'queued' && (
                    <span className="text-slate-400">Queued</span>
                  )}
                  {job.status === 'failed' && (
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-red-600 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                      <button 
                        onClick={() => handleRetryStage(job.stage)}
                        className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-sm font-semibold transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Analysis halted</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Cancel button */}
          <div className="pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel & Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
