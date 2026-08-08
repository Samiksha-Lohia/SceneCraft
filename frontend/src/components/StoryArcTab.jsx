import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceDot, 
  Line 
} from 'recharts';
import { BarChart2, Sparkles, LayoutGrid, CheckCircle2, BookOpen } from 'lucide-react';

export default function StoryArcTab({ documentId }) {
  const [arc, setArc] = useState(null);
  const [scenes, setScenes] = useState({});
  const [loading, setLoading] = useState(true);

  // Overlay toggles
  const [showThreeAct, setShowThreeAct] = useState(false);
  const [showHeroJourney, setShowHeroJourney] = useState(false);

  useEffect(() => {
    loadData();
  }, [documentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch scenes
      const sceneRes = await api.story.getScenes(documentId).catch(() => []);
      const scenesList = sceneRes.results || sceneRes || [];
      const scenesMap = {};
      scenesList.forEach(s => {
        scenesMap[s._id || s.id] = s;
      });
      setScenes(scenesMap);

      // 2. Fetch story arc
      const arcData = await api.story.getArc(documentId).catch(() => null);
      setArc(arcData);
    } catch (err) {
      console.error('Failed to load story arc:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build chart dataset including overlays
  const chartData = useMemo(() => {
    if (!arc || !arc.arcPoints) return [];
    
    const totalPoints = arc.arcPoints.length;
    
    return arc.arcPoints.map((pt, idx) => {
      const scene = scenes[pt.sceneId];
      const sceneNum = scene ? scene.sceneNumber : idx + 1;
      
      const point = {
        name: `Scene ${sceneNum}`,
        tension: pt.tensionScore || 0,
        label: pt.label || scene?.title || `Scene ${sceneNum}`,
        sceneId: pt.sceneId
      };

      // 1. Compute synthetic Three-Act Curve (starts low, peaks at 80% climax, then drops)
      // Normalizing x from 0 to 1
      const x = idx / (totalPoints - 1 || 1);
      let threeActVal = 0.2;
      if (x < 0.2) {
        // Setup (0 to 0.2) -> rises from 0.2 to 0.35
        threeActVal = 0.2 + (x / 0.2) * 0.15;
      } else if (x < 0.8) {
        // Rising Action (0.2 to 0.8) -> rises from 0.35 to 0.85
        threeActVal = 0.35 + ((x - 0.2) / 0.6) * 0.5;
      } else {
        // Falling Action & Resolution (0.8 to 1) -> drops from 0.85 to 0.2
        threeActVal = 0.85 - ((x - 0.8) / 0.2) * 0.65;
      }
      point.threeAct = Math.round(threeActVal * 100) / 100;

      // 2. Compute synthetic Hero's Journey Curve (Departure wave, Initiation wave, return climax at 85%)
      let heroVal = 0.25;
      if (x < 0.25) {
        // Call to adventure wave: peaks at 0.15, drops to 0.25
        heroVal = 0.25 + Math.sin((x / 0.25) * Math.PI) * 0.15;
      } else if (x < 0.6) {
        // Trials wave: peaks at 0.45, drops to 0.3
        heroVal = 0.25 + Math.sin(((x - 0.25) / 0.35) * Math.PI) * 0.25;
      } else if (x < 0.85) {
        // Supreme Ordeal and Climax: rises up to 0.9
        heroVal = 0.3 + ((x - 0.6) / 0.25) * 0.6;
      } else {
        // Resolution: falls to 0.3
        heroVal = 0.9 - ((x - 0.85) / 0.15) * 0.6;
      }
      point.heroJourney = Math.round(heroVal * 100) / 100;

      return point;
    });
  }, [arc, scenes]);

  // Find climax point on dataset
  const climaxPoint = useMemo(() => {
    if (chartData.length === 0) return null;
    if (arc && arc.climaxSceneId) {
      const found = chartData.find(d => d.sceneId === arc.climaxSceneId);
      if (found) return found;
    }
    // Fallback: point with max tension
    return [...chartData].sort((a, b) => b.tension - a.tension)[0];
  }, [chartData, arc]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-lg w-1/4"></div>
        <div className="h-[350px] bg-slate-100 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8">
        <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Story arc not mapped yet</h3>
        <p className="text-sm text-slate-500 mt-1">Make sure the narrative tension analysis job has completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Story Arc Visualization</h2>
          <p className="text-xs text-slate-500 mt-0.5">Plot scene-by-scene narrative tension to review pacing structure.</p>
        </div>

        {/* Structure overlays buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold">
          <span className="text-slate-400">Overlays:</span>
          <button
            onClick={() => setShowThreeAct(!showThreeAct)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              showThreeAct 
                ? 'bg-purple-50 border-purple-200 text-purple-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Three-Act Structure
          </button>
          <button
            onClick={() => setShowHeroJourney(!showHeroJourney)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              showHeroJourney 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Hero's Journey
          </button>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTension" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 1]} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-lg text-xs space-y-1 text-left">
                        <p className="font-bold font-mono">{data.name}</p>
                        <p className="font-serif italic">"{data.label}"</p>
                        <p className="font-semibold text-purple-400">Tension: {Math.round(data.tension * 100)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Primary Story Tension Curve */}
              <Area 
                type="monotone" 
                dataKey="tension" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorTension)" 
              />
              
              {/* Three Act Reference Line */}
              {showThreeAct && (
                <Line
                  type="monotone"
                  dataKey="threeAct"
                  stroke="#c084fc"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}

              {/* Hero Journey Reference Line */}
              {showHeroJourney && (
                <Line
                  type="monotone"
                  dataKey="heroJourney"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}

              {/* Peak Climax Marker */}
              {climaxPoint && (
                <ReferenceDot
                  x={climaxPoint.name}
                  y={climaxPoint.tension}
                  r={6}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                  label={{ value: '💥 Climax', position: 'top', fill: '#b91c1c', fontSize: 10, fontWeight: 'bold' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Climax Scene Details Card */}
      {climaxPoint && scenes[climaxPoint.sceneId] && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 flex items-start gap-4 shadow-3xs">
          <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-left">
            <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded-sm text-[8px] font-bold uppercase tracking-wider font-mono">
              Peak Climax Detected
            </span>
            <h3 className="font-serif font-bold text-slate-900 text-lg">
              {climaxPoint.name}: {scenes[climaxPoint.sceneId].title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-serif">
              {scenes[climaxPoint.sceneId].summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
