"use client";

import React, { useState } from "react";
import HoverSidebar from "../../components/HoverSidebar";

interface Asset {
  id: string;
  type: string;
  status: string;
  location: string;
  fuel: number;
  ammo: number;
  assigned_task: string;
}

export default function AssetAllocation() {
  const [assets, setAssets] = useState<Asset[]>([
    { id: "ch-01", type: "Chinook", status: "Ready", location: "FOB Alpha", fuel: 85, ammo: 100, assigned_task: "Unassigned" },
    { id: "ch-02", type: "Chinook", status: "Maintenance", location: "FOB Alpha", fuel: 45, ammo: 100, assigned_task: "Unassigned" },
    { id: "apache-01", type: "Apache", status: "Ready", location: "FOB Bravo", fuel: 90, ammo: 80, assigned_task: "Unassigned" },
    { id: "team-alpha", type: "Infantry Team", status: "Ready", location: "FOB Alpha", fuel: 100, ammo: 95, assigned_task: "Unassigned" },
    { id: "team-bravo", type: "Infantry Team", status: "Deployed", location: "Field", fuel: 60, ammo: 70, assigned_task: "Patrol" }
  ]);

  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [allocating, setAllocating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready': return 'text-green-400';
      case 'maintenance': return 'text-yellow-400';
      case 'deployed': return 'text-blue-400';
      case 'damaged': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getFuelColor = (fuel: number) => {
    if (fuel > 70) return 'text-green-400';
    if (fuel > 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAmmoColor = (ammo: number) => {
    if (ammo > 80) return 'text-green-400';
    if (ammo > 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <HoverSidebar />
      <div className="max-w-6xl mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-2">🚁 Asset Allocation Advisor</h1>
        <p className="text-gray-300 mb-6">AI suggests optimal tasking for available air and ground assets across mission phases. Outputs a justifiable tasking plan with asset status view.</p>
        
        {/* Asset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {assets.map((asset) => (
            <div 
              key={asset.id} 
              className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition-all ${
                selectedAsset === asset.id ? 'border-green-500 bg-gray-750' : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedAsset(asset.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{asset.id}</h3>
                  <p className="text-gray-400 text-sm">{asset.type}</p>
                </div>
                <span className={`text-sm font-bold ${getStatusColor(asset.status)}`}>
                  {asset.status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-200">{asset.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fuel:</span>
                  <span className={`font-bold ${getFuelColor(asset.fuel)}`}>{asset.fuel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ammo:</span>
                  <span className={`font-bold ${getAmmoColor(asset.ammo)}`}>{asset.ammo}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Task:</span>
                  <span className="text-gray-200">{asset.assigned_task}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Allocation Panel */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-300 mb-4">🤖 AI Asset Allocation</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Mission Requirements</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Mission Type</label>
                  <select className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600">
                    <option>Infiltration</option>
                    <option>Extraction</option>
                    <option>Reconnaissance</option>
                    <option>Direct Action</option>
                    <option>Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Duration</label>
                  <select className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600">
                    <option>2-4 hours</option>
                    <option>4-8 hours</option>
                    <option>8-12 hours</option>
                    <option>12+ hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Risk Level</label>
                  <select className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Extreme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Terrain Type</label>
                  <select className="w-full bg-gray-700 rounded px-3 py-2 text-gray-200 border border-gray-600">
                    <option>Urban</option>
                    <option>Rural</option>
                    <option>Mountain</option>
                    <option>Desert</option>
                    <option>Jungle</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-3">AI Recommendation</h3>
              <div className="bg-gray-700 rounded p-4 mb-4">
                <div className="text-gray-300 text-sm">
                  <p className="mb-2"><strong>Primary Assets:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>CH-01: Insertion/Extraction</li>
                    <li>Apache-01: Close Air Support</li>
                    <li>Team Alpha: Ground Operations</li>
                  </ul>
                  <p className="mt-3 mb-2"><strong>Justification:</strong></p>
                  <p className="text-gray-400">Chinook provides heavy lift capability for team insertion. Apache offers precision fire support. Infantry team provides ground presence and security.</p>
                </div>
              </div>
              
              <button 
                className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 rounded-lg border border-blue-600 disabled:opacity-50"
                disabled={allocating}
              >
                {allocating ? 'Generating Allocation...' : 'Generate AI Allocation'}
              </button>
            </div>
          </div>
        </div>

        {/* Asset Status Summary */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-300 mb-4">📊 Asset Status Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{assets.filter(a => a.status === 'Ready').length}</div>
              <div className="text-sm text-gray-400">Ready</div>
            </div>
            <div className="bg-gray-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{assets.filter(a => a.status === 'Maintenance').length}</div>
              <div className="text-sm text-gray-400">Maintenance</div>
            </div>
            <div className="bg-gray-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{assets.filter(a => a.status === 'Deployed').length}</div>
              <div className="text-sm text-gray-400">Deployed</div>
            </div>
            <div className="bg-gray-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-white">{assets.length}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 