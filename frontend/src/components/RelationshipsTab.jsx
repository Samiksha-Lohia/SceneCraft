import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitFork, Heart, HeartCrack, Sparkles, X, BookOpen } from 'lucide-react';

export default function RelationshipsTab({ documentId }) {
  const [relationships, setRelationships] = useState([]);
  const [characters, setCharacters] = useState({});
  const [scenes, setScenes] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedType, setSelectedType] = useState('all');
  const [sentimentRange, setSentimentRange] = useState([-1, 1]);
  
  // Edge detail panel state
  const [selectedEdge, setSelectedEdge] = useState(null);

  useEffect(() => {
    loadData();
  }, [documentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load characters
      const charsList = await api.story.getCharacters(documentId).catch(() => []);
      const charsMap = {};
      charsList.forEach(c => {
        charsMap[c._id || c.id] = c;
      });
      setCharacters(charsMap);

      // 2. Load scenes (to resolve shared scene titles in edge panel)
      const sceneRes = await api.story.getScenes(documentId).catch(() => []);
      const scenesList = sceneRes.results || sceneRes || [];
      const scenesMap = {};
      scenesList.forEach(s => {
        scenesMap[s._id || s.id] = s;
      });
      setScenes(scenesMap);

      // 3. Load relationships
      const relList = await api.story.getRelationships(documentId).catch(() => []);
      setRelationships(relList || []);
    } catch (err) {
      console.error('Failed to load relationship data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered relationships
  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      if (selectedType !== 'all' && rel.type !== selectedType) return false;
      if (rel.sentimentScore < sentimentRange[0] || rel.sentimentScore > sentimentRange[1]) return false;
      return true;
    });
  }, [relationships, selectedType, sentimentRange]);

  // Construct React Flow nodes and edges
  const { flowNodes, flowEdges } = useMemo(() => {
    const activeCharIds = new Set();
    filteredRelationships.forEach(r => {
      activeCharIds.add(r.characterAId);
      activeCharIds.add(r.characterBId);
    });

    const activeChars = Object.values(characters).filter(c => activeCharIds.has(c._id || c.id));
    
    // Auto circular layout
    const total = activeChars.length;
    const radius = Math.max(160, total * 30);
    const centerX = 350;
    const centerY = 250;

    const nodes = activeChars.map((char, index) => {
      const charId = char._id || char.id;
      const angle = (index / total) * 2 * Math.PI;
      
      const isProtagonist = char.role?.toLowerCase() === 'protagonist';
      const isAntagonist = char.role?.toLowerCase() === 'antagonist';

      let bgClass = 'bg-white';
      if (isProtagonist) bgClass = 'bg-[#fef08a] border-amber-400';
      else if (isAntagonist) bgClass = 'bg-rose-50 border-rose-400';

      return {
        id: charId,
        type: 'default',
        data: { 
          label: (
            <div className="text-center font-serif py-1 px-2 select-none">
              <p className="font-bold text-xs text-slate-800">{char.name}</p>
              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-sans mt-0.5">{char.role || 'cast'}</p>
            </div>
          )
        },
        position: {
          x: centerX + radius * Math.cos(angle) - 50,
          y: centerY + radius * Math.sin(angle) - 20,
        },
        style: {
          border: '2px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        },
        className: `${bgClass}`
      };
    });

    const edges = filteredRelationships.map((rel, index) => {
      const relId = rel._id || rel.id || `edge-${index}`;
      
      // Edge coloring based on sentimentScore
      // positive = green, negative = red, neutral = gray
      let color = '#94a3b8'; // gray
      if (rel.sentimentScore > 0.2) color = '#10b981'; // green
      else if (rel.sentimentScore < -0.2) color = '#ef4444'; // red

      const thickness = Math.max(2, Math.min(8, (rel.sceneIds?.length || 1) * 1.5));

      return {
        id: relId,
        source: rel.characterAId,
        target: rel.characterBId,
        animated: Math.abs(rel.sentimentScore) > 0.5,
        style: { 
          stroke: color, 
          strokeWidth: thickness,
          cursor: 'pointer'
        },
        data: { raw: rel }
      };
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [filteredRelationships, characters]);

  const handleEdgeClick = (event, edge) => {
    setSelectedEdge(edge.data.raw);
  };

  const getRelationshipTypeIcon = (type) => {
    if (type === 'romantic') return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
    if (type === 'rival') return <HeartCrack className="w-4 h-4 text-red-500" />;
    return <GitFork className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-lg w-1/4"></div>
        <div className="h-[450px] bg-slate-100 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Filters Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="text-left">
          <h2 className="text-2xl font-serif font-bold text-slate-900">Relationship Network</h2>
          <p className="text-xs text-slate-500 mt-0.5">Explore connections and sentiments between characters.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          {/* Dropdown type filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="all">All Connections</option>
              <option value="ally">Allies</option>
              <option value="rival">Rivals</option>
              <option value="family">Family</option>
              <option value="romantic">Romantic</option>
              <option value="mentor">Mentors</option>
            </select>
          </div>

          {/* Sentiment Slider filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sentiment:</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={sentimentRange[0]}
              onChange={(e) => setSentimentRange([parseFloat(e.target.value), sentimentRange[1]])}
              className="w-20 accent-slate-900"
            />
            <span className="text-slate-500 font-mono">to</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={sentimentRange[1]}
              onChange={(e) => setSentimentRange([sentimentRange[0], parseFloat(e.target.value)])}
              className="w-20 accent-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs relative flex">
        <div className="flex-1 h-full min-h-[450px]">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onEdgeClick={handleEdgeClick}
            fitView
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls className="!bg-white !border-slate-200 !shadow-xs rounded-lg" />
          </ReactFlow>
        </div>

        {/* Floating Side Info Panel for Clicked Connections */}
        {selectedEdge && (
          <div className="absolute top-4 right-4 bottom-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 overflow-y-auto flex flex-col justify-between z-20 text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-serif font-bold text-slate-900 flex items-center gap-1.5">
                  {getRelationshipTypeIcon(selectedEdge.type)}
                  Connection Details
                </h3>
                <button 
                  onClick={() => setSelectedEdge(null)}
                  className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Characters pair */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-sm font-semibold text-slate-800">
                  {characters[selectedEdge.characterAId]?.name}
                </span>
                <span className="text-slate-400 font-mono text-xs">↔</span>
                <span className="text-sm font-semibold text-slate-800">
                  {characters[selectedEdge.characterBId]?.name}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  <span className="block text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Type</span>
                  <span className="font-bold text-slate-700 capitalize">{selectedEdge.type}</span>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  <span className="block text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Sentiment</span>
                  <span className="font-bold text-slate-700">{selectedEdge.sentimentScore > 0 ? '+' : ''}{selectedEdge.sentimentScore}</span>
                </div>
              </div>

              {/* Shared scenes list */}
              {selectedEdge.sceneIds && selectedEdge.sceneIds.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Interaction Scenes ({selectedEdge.sceneIds.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedEdge.sceneIds.map((sceneId) => {
                      const scene = scenes[sceneId];
                      if (!scene) return null;
                      return (
                        <div 
                          key={sceneId}
                          className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-xs"
                        >
                          <span className="font-mono font-bold text-slate-400">Scene {scene.sceneNumber}:</span>
                          <span className="font-serif font-semibold text-slate-800 ml-1">{scene.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 text-center mt-4">
              Click another line in the network to inspect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
