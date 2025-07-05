"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../components/WebSocketProvider';
import Link from 'next/link';
import GoogleMapReact from 'google-map-react';
import IncidentCard from './IncidentCard';

const BACKEND_URL = 'http://localhost:8000';

const UNITS = ['police-1', 'police-2', 'fire-1', 'fire-2', 'emt-1', 'emt-2'];

interface Incident {
  incident_id: string;
  type: string;
  priority: string;
  location: { lat: number; lng: number };
  status: string;
  description: string;
  created_at: string;
  assigned_units: string[];
}

// Custom marker components for GoogleMapReact
interface MarkerProps { lat: number; lng: number; }
const UnitMarker = (props: MarkerProps) => <span role="img" aria-label="unit" style={{ fontSize: 32 }}>🚓</span>;
const IncidentMarker = (props: MarkerProps) => <span role="img" aria-label="incident" style={{ fontSize: 32 }}>📍</span>;

// Add a helper hook to fetch directions for each incident
function useIncidentDirections(unitLocation: { lat: number; lng: number } | null, incidentLocation: { lat: number; lng: number } | null, show: boolean) {
  const [directions, setDirections] = useState<any>(null);
  useEffect(() => {
    if (show && unitLocation && incidentLocation && window.google && window.google.maps) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: unitLocation,
          destination: incidentLocation,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === 'OK') {
            setDirections(result);
          } else {
            setDirections(null);
          }
        }
      );
    } else {
      setDirections(null);
    }
  }, [unitLocation, incidentLocation, show]);
  return directions;
}

export default function ResponderPortalContent() {
  const { isConnected, lastMessage } = useWebSocket();
  const [unit, setUnit] = useState(UNITS[0]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [note, setNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [unitStatus, setUnitStatus] = useState('available');
  const [unitLocation, setUnitLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [incidentActionLogs, setIncidentActionLogs] = useState<any[]>([]);
  const [showIncidentActionLogs, setShowIncidentActionLogs] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchIncidents();
  }, [unit]);

  // Fetch unit location when en route to an incident
  const fetchUnitLocation = async () => {
    const response = await fetch(`${BACKEND_URL}/api/units/${unit}`);
    const data = await response.json();
    if (data.unit && data.unit.current_location) {
      setUnitLocation(data.unit.current_location);
    } else {
      setUnitLocation(null);
    }
  };

  useEffect(() => {
    fetchUnitLocation();
  }, [unit]);

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'incident_update') {
      fetchIncidents(); // Refresh incidents when we get an update
      fetchUnitLocation(); // <-- Also refresh unit location for real-time route update
    }
  }, [lastMessage]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents`);
      const data = await response.json();
      setIncidents((data.incidents || []).filter((i: Incident) => i.assigned_units && i.assigned_units.includes(unit)));
    } catch (e) {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (incidentId: string, status: string) => {
    setStatusUpdating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/responder-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          unit_id: unit,
          user: unit 
        })
      });
      
      if (response.ok) {
        // Refresh incidents to get updated status
        fetchIncidents();
        
        // Show success notification
        if (status === 'on_scene') {
          console.log('Unit is now on scene');
        } else if (status === 'resolved') {
          console.log('Incident resolved');
        }
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const submitNote = async (incidentId: string) => {
    if (!note.trim()) return;
    setNoteSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/responder-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes: note, 
          unit_id: unit,
          user: unit 
        })
      });
      
      if (response.ok) {
        setNote('');
        // Refresh incidents to ensure we have latest data
        fetchIncidents();
        console.log('Note added successfully');
      } else {
        console.error('Failed to add note');
      }
    } catch (error) {
      console.error('Error submitting note:', error);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const updateUnitStatus = async (newStatus: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/units/${unit}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          user: unit 
        })
      });
      setUnitStatus(newStatus);
    } catch (error) {
      console.error('Error updating unit status:', error);
    }
  };

  const fetchIncidentActionLogs = async (incidentId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/actions`);
      const data = await response.json();
      setIncidentActionLogs(data.actions || []);
      setShowIncidentActionLogs(true);
    } catch (error) {
      console.error('Failed to fetch incident action logs:', error);
    }
  };

  // Helper to draw a line between two points
  const renderRoute = (map: any, maps: any, from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    if (!from || !to) return;
    const line = new maps.Polyline({
      path: [from, to],
      geodesic: true,
      strokeColor: '#A3B18A',
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });
    line.setMap(map);
  };

  return (
    <div className="min-h-screen bg-[#181A1B] text-[#F3F3E7] flex flex-col items-center py-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Responder Portal</h1>
          <Link href="/" className="px-4 py-2 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors">Back to Home</Link>
        </div>
        
        {/* Connection Status */}
        <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
          {isConnected ? '🟢 Connected (Real-time)' : '🔴 Disconnected'}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <span className="font-semibold">Select Unit:</span>
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="px-4 py-2 bg-[#23272f] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          
          <span className="font-semibold ml-4">Unit Status:</span>
          <div className="flex gap-2">
            <button
              onClick={() => updateUnitStatus('available')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                unitStatus === 'available' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-600/20 text-green-400 hover:bg-green-600/40'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => updateUnitStatus('busy')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                unitStatus === 'busy' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/40'
              }`}
            >
              Busy
            </button>
            <button
              onClick={() => updateUnitStatus('off-duty')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                unitStatus === 'off-duty' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-600/20 text-red-400 hover:bg-red-600/40'
              }`}
            >
              Off Duty
            </button>
          </div>
        </div>
        
        <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6">
          <h2 className="text-xl font-bold mb-4">My Active Incidents</h2>
          {loading ? (
            <div className="text-[#A3B18A]">Loading...</div>
          ) : incidents.length === 0 ? (
            <div className="text-[#A3B18A]">No assigned incidents.</div>
          ) : (
            <ul className="space-y-4">
              {incidents.map((incident) => {
                const isAssigned = incident.assigned_units && incident.assigned_units.includes(unit);
                return (
                  <IncidentCard
                    key={incident.incident_id}
                    incident={incident}
                    unitLocation={unitLocation}
                    isAssigned={isAssigned}
                    unit={unit}
                    showDirections
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-semibold">{incident.type}</span>
                        <span className="ml-3 px-2 py-1 rounded-full text-xs font-semibold bg-[#A3B18A]/20 text-[#A3B18A]">Priority {incident.priority}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchIncidentActionLogs(incident.incident_id)}
                          className="px-3 py-1 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                        >
                          History
                        </button>
                        <button
                          onClick={() => updateStatus(incident.incident_id, 'dispatched')}
                          disabled={statusUpdating || incident.status === 'dispatched'}
                          className={`px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors ${incident.status === 'dispatched' ? 'opacity-50' : ''}`}
                        >
                          En Route
                        </button>
                        <button
                          onClick={() => updateStatus(incident.incident_id, 'on_scene')}
                          disabled={statusUpdating || incident.status === 'on_scene'}
                          className={`px-3 py-1 rounded bg-yellow-600 text-white text-xs font-semibold hover:bg-yellow-700 transition-colors ${incident.status === 'on_scene' ? 'opacity-50' : ''}`}
                        >
                          On Scene
                        </button>
                        <button
                          onClick={() => updateStatus(incident.incident_id, 'resolved')}
                          disabled={statusUpdating || incident.status === 'resolved'}
                          className={`px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors ${incident.status === 'resolved' ? 'opacity-50' : ''}`}
                        >
                          Resolved
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 text-sm text-[#A3B18A]">{incident.description}</div>
                    <div className="mb-2 text-xs text-[#F3F3E7]">Location: {incident.location?.lat?.toFixed(4)}, {incident.location?.lng?.toFixed(4)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Add note..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#23272f] border border-[#A3B18A] rounded-lg text-[#F3F3E7] text-sm"
                      />
                      <button
                        onClick={() => submitNote(incident.incident_id)}
                        disabled={noteSubmitting || !note.trim()}
                        className="px-4 py-2 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors text-sm"
                      >
                        Add Note
                      </button>
                    </div>
                  </IncidentCard>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Incident Action Logs Modal */}
      {showIncidentActionLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#F3F3E7]">Incident History</h2>
              <button
                onClick={() => setShowIncidentActionLogs(false)}
                className="text-[#A3B18A] hover:text-[#F3F3E7] transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {incidentActionLogs.length === 0 ? (
                <p className="text-[#F3F3E7] text-center py-8">No history available for this incident</p>
              ) : (
                incidentActionLogs.map((log, index) => (
                  <div key={index} className="bg-[#181A1B] p-4 rounded-lg border border-[#A3B18A]/20">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          log.action === 'created' ? 'bg-green-900/20 text-green-400' :
                          log.action === 'updated' ? 'bg-blue-900/20 text-blue-400' :
                          log.action === 'dispatched' ? 'bg-yellow-900/20 text-yellow-400' :
                          log.action === 'status_update' ? 'bg-orange-900/20 text-orange-400' :
                          log.action === 'responder_note' ? 'bg-purple-900/20 text-purple-400' :
                          'bg-gray-900/20 text-gray-400'
                        }`}>
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[#F3F3E7] font-semibold">
                          {log.details?.unit_id || log.user}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[#A3B18A] text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {log.details && (
                      <div className="mt-2 text-sm">
                        {log.action === 'created' && (
                          <div className="text-[#F3F3E7]">
                            Created {log.details.type} incident with priority {log.details.priority}
                            {log.details.description && `: "${log.details.description}"`}
                          </div>
                        )}
                        {log.action === 'updated' && (
                          <div className="text-[#F3F3E7]">
                            {Object.entries(log.details).map(([field, change]: [string, any]) => (
                              <div key={field} className="mb-1">
                                <span className="text-[#A3B18A]">{field}:</span>{' '}
                                <span className="text-red-400">{change.from}</span>{' '}
                                <span className="text-[#A3B18A]">→</span>{' '}
                                <span className="text-green-400">{change.to}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {log.action === 'dispatched' && (
                          <div className="text-[#F3F3E7]">
                            Dispatched unit {log.details.unit_id} to incident
                          </div>
                        )}
                        {log.action === 'status_update' && (
                          <div className="text-[#F3F3E7]">
                            <span className="text-[#A3B18A]">Status changed:</span>{' '}
                            <span className="text-red-400">{log.details.from}</span>{' '}
                            <span className="text-[#A3B18A]">→</span>{' '}
                            <span className="text-green-400">{log.details.to}</span>
                            {log.details.action && (
                              <div className="mt-1 text-[#A3B18A] italic">
                                {log.details.action}
                              </div>
                            )}
                          </div>
                        )}
                        {log.action === 'responder_note' && (
                          <div className="text-[#F3F3E7]">
                            <div className="text-[#A3B18A] mb-1">Note added:</div>
                            <div className="bg-[#23272f] p-3 rounded-lg border border-[#A3B18A]/20 italic">
                              "{log.details.notes}"
                            </div>
                            {log.details.action && (
                              <div className="mt-2 text-[#A3B18A] text-xs">
                                {log.details.action}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 