"use client";

import React, { useState } from "react";

interface ContingencyPlan {
  type: string;
  description: string;
  frequency: string;
  call_sign: string;
  backup_frequency: string;
  notes: string;
  status: 'draft' | 'approved';
}

export default function ContingencyPlan() {
  const [plans, setPlans] = useState<ContingencyPlan[]>([
    {
      type: "Primary",
      description: "Standard mission communications",
      frequency: "123.45 MHz",
      call_sign: "EAGLE-01",
      backup_frequency: "234.56 MHz",
      notes: "Primary comms for all mission phases",
      status: 'approved'
    },
    {
      type: "Alternate",
      description: "Backup communications channel",
      frequency: "345.67 MHz",
      call_sign: "EAGLE-02",
      backup_frequency: "456.78 MHz",
      notes: "Use if primary is compromised",
      status: 'approved'
    },
    {
      type: "Contingency",
      description: "Emergency communications",
      frequency: "567.89 MHz",
      call_sign: "EAGLE-EMERGENCY",
      backup_frequency: "678.90 MHz",
      notes: "Emergency only - life or death situations",
      status: 'approved'
    },
    {
      type: "Emergency",
      description: "Last resort communications",
      frequency: "789.01 MHz",
      call_sign: "EAGLE-MAYDAY",
      backup_frequency: "890.12 MHz",
      notes: "Absolute last resort - use only when all else fails",
      status: 'approved'
    }
  ]);

  const [generating, setGenerating] = useState(false);
  const [missionType, setMissionType] = useState("Infiltration");
  const [duration, setDuration] = useState("4-8 hours");
  const [terrain, setTerrain] = useState("Urban");
  const [threatLevel, setThreatLevel] = useState("Medium");

  const getStatusColor = (status: string) => {
    return status === 'approved' ? 'text-green-400' : 'text-yellow-400';
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'primary': return 'bg-blue-900 border-blue-600';
      case 'alternate': return 'bg-green-900 border-green-600';
      case 'contingency': return 'bg-yellow-900 border-yellow-600';
      case 'emergency': return 'bg-red-900 border-red-600';
      default: return 'bg-gray-900 border-gray-600';
    }
  };

  const generatePACEPLans = async () => {
    setGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-2">📡 Contingency Plan Generator (P-A-C-E)</h1>
      <p className="text-gray-300 mb-6">Auto-generates Primary, Alternate, Contingency, Emergency comms plans based on mission context. Editable toggles for user review.</p>
      
      {/* Mission Context */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-green-300 mb-4">🎯 Mission Context</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Mission Type</label>
            <select 
              className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600"
              value={missionType}
              onChange={(e) => setMissionType(e.target.value)}
            >
              <option>Infiltration</option>
              <option>Extraction</option>
              <option>Reconnaissance</option>
              <option>Direct Action</option>
              <option>Support</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Duration</label>
            <select 
              className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option>2-4 hours</option>
              <option>4-8 hours</option>
              <option>8-12 hours</option>
              <option>12+ hours</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Terrain</label>
            <select 
              className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600"
              value={terrain}
              onChange={(e) => setTerrain(e.target.value)}
            >
              <option>Urban</option>
              <option>Rural</option>
              <option>Mountain</option>
              <option>Desert</option>
              <option>Jungle</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Threat Level</label>
            <select 
              className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600"
              value={threatLevel}
              onChange={(e) => setThreatLevel(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Extreme</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <button 
            className="bg-blue-800 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg border border-blue-600 disabled:opacity-50"
            onClick={generatePACEPLans}
            disabled={generating}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Generating P-A-C-E Plans...
              </span>
            ) : (
              "Generate P-A-C-E Plans"
            )}
          </button>
        </div>
      </div>

      {/* P-A-C-E Plans */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-green-300">📋 Communications Plan</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`border rounded-lg p-4 ${getTypeColor(plan.type)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-white">{plan.type}</h3>
                <span className={`text-sm font-bold ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Description</label>
                  <input 
                    className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-600"
                    value={plan.description}
                    onChange={(e) => {
                      const newPlans = [...plans];
                      newPlans[idx].description = e.target.value;
                      setPlans(newPlans);
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Frequency</label>
                    <input 
                      className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-600"
                      value={plan.frequency}
                      onChange={(e) => {
                        const newPlans = [...plans];
                        newPlans[idx].frequency = e.target.value;
                        setPlans(newPlans);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Call Sign</label>
                    <input 
                      className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-600"
                      value={plan.call_sign}
                      onChange={(e) => {
                        const newPlans = [...plans];
                        newPlans[idx].call_sign = e.target.value;
                        setPlans(newPlans);
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Backup Frequency</label>
                  <input 
                    className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-600"
                    value={plan.backup_frequency}
                    onChange={(e) => {
                      const newPlans = [...plans];
                      newPlans[idx].backup_frequency = e.target.value;
                      setPlans(newPlans);
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Notes</label>
                  <textarea 
                    className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-600"
                    value={plan.notes}
                    rows={2}
                    onChange={(e) => {
                      const newPlans = [...plans];
                      newPlans[idx].notes = e.target.value;
                      setPlans(newPlans);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Summary */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-300 mb-4">📊 Plan Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-900 border border-blue-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">P</div>
            <div className="text-sm text-gray-400">Primary</div>
            <div className="text-xs text-gray-500">123.45 MHz</div>
          </div>
          <div className="bg-green-900 border border-green-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-green-400">A</div>
            <div className="text-sm text-gray-400">Alternate</div>
            <div className="text-xs text-gray-500">345.67 MHz</div>
          </div>
          <div className="bg-yellow-900 border border-yellow-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">C</div>
            <div className="text-sm text-gray-400">Contingency</div>
            <div className="text-xs text-gray-500">567.89 MHz</div>
          </div>
          <div className="bg-red-900 border border-red-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-red-400">E</div>
            <div className="text-sm text-gray-400">Emergency</div>
            <div className="text-xs text-gray-500">789.01 MHz</div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button className="bg-green-800 hover:bg-green-700 text-white font-bold px-6 py-2 rounded border border-green-600">
            Approve All Plans
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded border border-gray-600">
            Export to PDF
          </button>
          <button className="bg-blue-800 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded border border-blue-600">
            Share with Team
          </button>
        </div>
      </div>
    </div>
  );
} 