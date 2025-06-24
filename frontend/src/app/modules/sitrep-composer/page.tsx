"use client";

import React, { useState } from "react";

interface SITREP {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'approved' | 'sent';
  timestamp: string;
  author: string;
}

export default function SITREPComposer() {
  const [sitreps, setSitreps] = useState<SITREP[]>([
    {
      id: "1",
      title: "Mission Alpha - Initial SITREP",
      content: "SITUATION: Team successfully inserted at LZ Alpha at 0600. No enemy contact during insertion.\n\nMISSION: Conduct reconnaissance of target area and establish observation post.\n\nEXECUTION: Team is currently in position and establishing comms with higher headquarters.\n\nADMIN/LOG: All personnel accounted for. Equipment status green.\n\nCOMMAND/SIGNAL: Primary comms established. Backup frequencies available.",
      status: 'approved',
      timestamp: "2024-01-15T06:00:00Z",
      author: "Team Leader"
    }
  ]);

  const [currentSitrep, setCurrentSitrep] = useState<SITREP>({
    id: "2",
    title: "",
    content: "",
    status: 'draft',
    timestamp: new Date().toISOString(),
    author: "Team Leader"
  });

  const [composing, setComposing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'sent': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-900 border-yellow-600';
      case 'approved': return 'bg-green-900 border-green-600';
      case 'sent': return 'bg-blue-900 border-blue-600';
      default: return 'bg-gray-900 border-gray-600';
    }
  };

  const generateSITREP = async () => {
    setComposing(true);
    // Simulate AI generation
    setTimeout(() => {
      setCurrentSitrep({
        ...currentSitrep,
        content: `SITUATION: ${currentSitrep.title || 'Mission'} is currently in progress. Team status is operational.\n\nMISSION: ${currentSitrep.title || 'Mission'} objectives are being pursued according to plan.\n\nEXECUTION: Team is executing assigned tasks with no significant deviations from timeline.\n\nADMIN/LOG: All personnel accounted for. Equipment and supplies adequate for mission duration.\n\nCOMMAND/SIGNAL: Communications established and maintained with higher headquarters.`,
        status: 'draft'
      });
      setComposing(false);
    }, 2000);
  };

  const saveSITREP = () => {
    if (currentSitrep.title && currentSitrep.content) {
      setSitreps([...sitreps, { ...currentSitrep, id: Date.now().toString() }]);
      setCurrentSitrep({
        id: (Date.now() + 1).toString(),
        title: "",
        content: "",
        status: 'draft',
        timestamp: new Date().toISOString(),
        author: "Team Leader"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-2">📝 SITREP Composer</h1>
      <p className="text-gray-300 mb-6">AI-assisted Situation Report composer with templates, auto-generation, and approval workflow. Supports real-time updates and distribution.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SITREP Composer */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-green-300">✍️ Compose SITREP</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">SITREP Title</label>
                <input 
                  className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600 focus:border-green-500 focus:outline-none"
                  value={currentSitrep.title}
                  onChange={(e) => setCurrentSitrep({...currentSitrep, title: e.target.value})}
                  placeholder="e.g., Mission Alpha - Update 1"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">SITREP Content</label>
                <textarea 
                  className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600 focus:border-green-500 focus:outline-none"
                  value={currentSitrep.content}
                  onChange={(e) => setCurrentSitrep({...currentSitrep, content: e.target.value})}
                  rows={12}
                  placeholder="Enter SITREP content using SALUTE format..."
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  className="bg-blue-800 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded border border-blue-600 disabled:opacity-50"
                  onClick={generateSITREP}
                  disabled={composing}
                >
                  {composing ? 'Generating...' : 'AI Generate'}
                </button>
                <button 
                  className="bg-green-800 hover:bg-green-700 text-white font-bold px-4 py-2 rounded border border-green-600"
                  onClick={saveSITREP}
                >
                  Save Draft
                </button>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded border border-gray-600"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>
          </div>
          
          {/* SITREP Template */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">📋 SALUTE Template</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <div><strong>S</strong> - Situation: Current tactical situation</div>
              <div><strong>A</strong> - Mission: Current mission and objectives</div>
              <div><strong>L</strong> - Execution: How mission is being executed</div>
              <div><strong>U</strong> - Admin/Log: Personnel, equipment, supplies</div>
              <div><strong>T</strong> - Command/Signal: Communications status</div>
              <div><strong>E</strong> - Enemy: Enemy activity and disposition</div>
            </div>
          </div>
        </div>
        
        {/* SITREP History & Preview */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-green-300">📚 SITREP History</h2>
          
          {/* Preview */}
          {showPreview && currentSitrep.content && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-3">👁️ Preview</h3>
              <div className="bg-gray-700 rounded p-4">
                <h4 className="font-bold text-white mb-2">{currentSitrep.title || 'Untitled SITREP'}</h4>
                <pre className="text-gray-200 text-sm whitespace-pre-wrap">{currentSitrep.content}</pre>
                <div className="mt-3 text-xs text-gray-400">
                  <span>Status: </span>
                  <span className={getStatusColor(currentSitrep.status)}>{currentSitrep.status}</span>
                  <span className="ml-4">Author: {currentSitrep.author}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* SITREP List */}
          <div className="space-y-3">
            {sitreps.map((sitrep) => (
              <div 
                key={sitrep.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${getStatusBg(sitrep.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{sitrep.title}</h3>
                  <span className={`text-sm font-bold ${getStatusColor(sitrep.status)}`}>
                    {sitrep.status}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                  {sitrep.content.substring(0, 150)}...
                </p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{sitrep.author}</span>
                  <span>{new Date(sitrep.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-300 mb-4">⚡ Quick Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-green-800 hover:bg-green-700 text-white font-bold py-3 px-4 rounded border border-green-600">
            Approve All
          </button>
          <button className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded border border-blue-600">
            Send to Command
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded border border-gray-600">
            Export PDF
          </button>
          <button className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded border border-purple-600">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
} 