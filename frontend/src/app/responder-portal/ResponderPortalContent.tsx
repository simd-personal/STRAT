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
  notes?: string[];
  resolved_at?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: any;
  incident_id?: string;
  unit_id?: string;
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
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIncident, setExpandedIncident] = useState<Incident | null>(null);
  const [note, setNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [unitStatus, setUnitStatus] = useState('available');
  const [unitLocation, setUnitLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [incidentActionLogs, setIncidentActionLogs] = useState<ActivityLog[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityLog[]>([]);
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchIncidents();
    fetchActivityFeed();
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
      fetchUnitLocation(); // Also refresh unit location for real-time route update
      fetchActivityFeed(); // Refresh activity feed
    }
  }, [lastMessage]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents`);
      const data = await response.json();
      const allIncidentsData = data.incidents || [];
      setAllIncidents(allIncidentsData);
      setIncidents(allIncidentsData.filter((i: Incident) => i.assigned_units && i.assigned_units.includes(unit)));
    } catch (e) {
      setIncidents([]);
      setAllIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/activity-feed`);
      const data = await response.json();
      setActivityFeed(data.activities || []);
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
      setActivityFeed([]);
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
        fetchIncidents();
        fetchActivityFeed();
        
        if (status === 'on_scene') {
          console.log('Unit is now on scene');
        } else if (status === 'resolved') {
          console.log('Incident resolved');
          setExpandedIncident(null); // Close expanded view when resolved
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
        fetchIncidents();
        fetchActivityFeed();
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
    } catch (error) {
      console.error('Failed to fetch incident action logs:', error);
    }
  };

  const expandIncident = async (incident: Incident) => {
    setExpandedIncident(incident);
    await fetchIncidentActionLogs(incident.incident_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-600/20 text-blue-400';
      case 'dispatched': return 'bg-yellow-600/20 text-yellow-400';
      case 'on_scene': return 'bg-orange-600/20 text-orange-400';
      case 'resolved': return 'bg-green-600/20 text-green-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600/20 text-red-400';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400';
      case 'low': return 'bg-green-600/20 text-green-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#181A1B] text-[#F3F3E7] flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Responder Portal</h1>
          <Link href="/" className="px-4 py-2 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors">Back to Home</Link>
        </div>
        
        {/* Connection Status */}
        <div className={`px-4 py-2 rounded-lg text-sm font-semibold mb-4 ${isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
          {isConnected ? '🟢 Connected (Real-time)' : '🔴 Disconnected'}
        </div>

        {/* Unit Selection and Status */}
        <div className="flex items-center gap-4 mb-6">
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

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6">
          {/* My Incidents */}
          <div className="flex-1 bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6">
            <h2 className="text-xl font-bold mb-4">My Active Incidents</h2>
            {loading ? (
              <div className="text-[#A3B18A]">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="text-[#A3B18A]">No assigned incidents.</div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.incident_id} className="bg-[#181A1B] rounded-lg p-4 border border-[#A3B18A]/30">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-lg">{incident.type}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(incident.priority)}`}>
                            Priority {incident.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                            {incident.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-[#A3B18A] mb-2">{incident.description}</p>
                        <p className="text-xs text-[#F3F3E7]">Location: {incident.location?.lat?.toFixed(4)}, {incident.location?.lng?.toFixed(4)}</p>
                      </div>
                      <button
                        onClick={() => expandIncident(incident)}
                        className="px-4 py-2 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors text-sm"
                      >
                        {expandedIncident?.incident_id === incident.incident_id ? 'Collapse' : 'Expand'}
                      </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-3">
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

                    {/* Expanded Incident View */}
                    {expandedIncident?.incident_id === incident.incident_id && (
                      <div className="border-t border-[#A3B18A]/30 pt-4 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Map and Route */}
                          <div>
                            <h3 className="font-semibold mb-3">Route to Incident</h3>
                            <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                              <GoogleMapReact
                                bootstrapURLKeys={{ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' }}
                                defaultCenter={incident.location}
                                defaultZoom={14}
                                yesIWantToUseGoogleMapApiInternals
                                onGoogleApiLoaded={({ map, maps }) => {
                                  if (unitLocation) {
                                    const directionsService = new maps.DirectionsService();
                                    directionsService.route(
                                      {
                                        origin: unitLocation,
                                        destination: incident.location,
                                        travelMode: maps.TravelMode.DRIVING,
                                      },
                                      (result: any, status: any) => {
                                        if (status === 'OK') {
                                          new maps.DirectionsRenderer({
                                            map,
                                            directions: result,
                                            suppressMarkers: true,
                                            polylineOptions: { strokeColor: '#A3B18A', strokeWeight: 5 },
                                          });
                                        }
                                      }
                                    );
                                  }
                                }}
                              >
                                {unitLocation && <UnitMarker lat={unitLocation.lat} lng={unitLocation.lng} />}
                                <IncidentMarker lat={incident.location.lat} lng={incident.location.lng} />
                              </GoogleMapReact>
                            </div>
                          </div>

                          {/* Incident Details and Actions */}
                          <div>
                            <h3 className="font-semibold mb-3">Incident Details</h3>
                            <div className="space-y-4">
                              {/* Add Note */}
                              <div>
                                <label className="block text-sm font-semibold mb-2">Add Note</label>
                                <div className="flex gap-2">
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
                                    Add
                                  </button>
                                </div>
                              </div>

                              {/* Incident History */}
                              <div>
                                <h4 className="font-semibold mb-2">Incident History</h4>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                  {incidentActionLogs.length === 0 ? (
                                    <p className="text-[#A3B18A] text-sm">No history available</p>
                                  ) : (
                                    incidentActionLogs.map((log, index) => (
                                      <div key={index} className="bg-[#23272f] p-3 rounded-lg border border-[#A3B18A]/20">
                                        <div className="flex justify-between items-start mb-1">
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
                                          <span className="text-[#A3B18A] text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="text-sm text-[#F3F3E7]">
                                          {log.details?.notes || log.details?.action || `${log.user} - ${log.action}`}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed Sidebar */}
          <div className="w-80 bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Activity Feed</h3>
              <button
                onClick={() => setShowActivityFeed(!showActivityFeed)}
                className="text-[#A3B18A] hover:text-[#F3F3E7] transition-colors"
              >
                {showActivityFeed ? '−' : '+'}
              </button>
            </div>
            
            {showActivityFeed && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityFeed.length === 0 ? (
                  <p className="text-[#A3B18A] text-sm">No recent activity</p>
                ) : (
                  activityFeed.map((activity, index) => (
                    <div key={index} className="bg-[#181A1B] p-3 rounded-lg border border-[#A3B18A]/20">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          activity.action === 'created' ? 'bg-green-900/20 text-green-400' :
                          activity.action === 'dispatched' ? 'bg-yellow-900/20 text-yellow-400' :
                          activity.action === 'status_update' ? 'bg-orange-900/20 text-orange-400' :
                          'bg-gray-900/20 text-gray-400'
                        }`}>
                          {activity.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[#A3B18A] text-xs">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-[#F3F3E7]">
                        <div className="font-semibold">{activity.user}</div>
                        <div className="text-[#A3B18A]">
                          {activity.incident_id ? `Incident ${activity.incident_id}` : ''}
                          {activity.unit_id ? `Unit ${activity.unit_id}` : ''}
                        </div>
                        {activity.details?.notes && (
                          <div className="mt-1 text-xs italic">"{activity.details.notes}"</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 