"use client";

import { useState, useEffect } from 'react';
import { useWebSocket } from '../../components/WebSocketProvider';

const BACKEND_URL = 'http://localhost:8000';

interface Unit {
  id: string;
  type: string;
  status: string;
  current_location: any;
  eta: any;
}

export default function UnitStatusPanel() {
  const { isConnected, lastMessage } = useWebSocket();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, []);

  // Handle real-time unit updates from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'unit_update') {
      fetchUnits(); // Refresh units when we get an update
    }
  }, [lastMessage]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/units`);
      const data = await response.json();
      setUnits(data.units || []);
    } catch (error) {
      console.error('Failed to fetch units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-600/20 text-green-400';
      case 'busy':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'off-duty':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'police':
        return 'bg-blue-600/20 text-blue-400';
      case 'fire':
        return 'bg-red-600/20 text-red-400';
      case 'emt':
        return 'bg-green-600/20 text-green-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6">
        <h3 className="text-lg font-bold text-[#F3F3E7] mb-4">Unit Status</h3>
        <div className="text-[#A3B18A]">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#F3F3E7]">Unit Status</h3>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
          {isConnected ? '🟢 Live' : '🔴 Offline'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {units.map((unit) => (
          <div key={unit.id} className="bg-[#181A1B] rounded-lg p-3 border border-[#A3B18A]/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#F3F3E7]">{unit.id}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(unit.type)}`}>
                {unit.type.toUpperCase()}
              </span>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(unit.status)}`}>
              {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
            </div>
            {unit.eta && (
              <div className="text-xs text-[#A3B18A] mt-1">
                ETA: {unit.eta}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {units.length === 0 && (
        <div className="text-[#A3B18A] text-center py-4">
          No units available
        </div>
      )}
    </div>
  );
} 