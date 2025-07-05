"use client";

import { useState, useEffect, useRef } from "react";
import { notify } from "../../components/notify";
import GoogleOpsMap from '../../components/GoogleOpsMap';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useWebSocket } from "../../components/WebSocketProvider";
import UnitStatusPanel from './UnitStatusPanel';

interface Incident {
  incident_id: string;
  type: string;
  priority: string;
  location: { lat: number; lng: number };
  status: "new" | "dispatched" | "on_scene" | "resolved";
  description: string;
  created_at: string;
  resolved_at?: string;
  assigned_units: string[];
}

interface Unit {
  id: string;
  position: { lat: number; lng: number };
  status: string;
  name: string;
  destination?: { lat: number; lng: number };
}

const BACKEND_URL = 'http://localhost:8000';

// Test data for demo map
const TEST_INCIDENTS = [
  { incident_id: 'hazard1', type: 'Hazard', priority: 'high', location: { lat: 33.6411, lng: -117.9187 }, status: 'new', description: 'Chemical spill reported', created_at: new Date().toISOString(), assigned_units: [] },
];

const INITIAL_UNITS = [
  { id: 'unit1', position: { lat: 33.646, lng: -117.918 }, status: 'ready', name: 'Unit 1' },
  { id: 'unit2', position: { lat: 33.638, lng: -117.926 }, status: 'ready', name: 'Unit 2' },
  { id: 'unit3', position: { lat: 33.635, lng: -117.912 }, status: 'ready', name: 'Unit 3' },
  { id: 'unit4', position: { lat: 33.642, lng: -117.930 }, status: 'ready', name: 'Unit 4' },
];

export default function IncidentManagement() {
  const { isConnected, lastMessage } = useWebSocket();
  
  // Restore backend state for incidents
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showIncidentDetailsModal, setShowIncidentDetailsModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 33.6411, lng: -117.9187 });
  const [mapZoom, setMapZoom] = useState(16);
  const mapRef = useRef<any>(null);
  
  // Form states
  const [newIncident, setNewIncident] = useState({
    type: "",
    priority: "medium",
    location: { lat: 39.8283, lng: -98.5795 },
    description: ""
  });
  const [dispatchUnits, setDispatchUnits] = useState<string[]>([]);

  // Available units from backend
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);

  const [modalIncidentLocation, setModalIncidentLocation] = useState({ lat: 33.6411, lng: -117.9187 });

  // Undo/cancel after creation
  const [lastCreatedIncidentId, setLastCreatedIncidentId] = useState<string | null>(null);

  // Accessibility: focus modal on open
  const modalRef = useRef<HTMLDivElement>(null);

  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);

  // Real-time updates and notifications
  const [lastIncidentCount, setLastIncidentCount] = useState(0);
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [showActionLogs, setShowActionLogs] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [incidentActionLogs, setIncidentActionLogs] = useState<any[]>([]);
  const [showIncidentActionLogs, setShowIncidentActionLogs] = useState(false);

  useEffect(() => {
    fetchIncidents();
    fetchActionLogs();
    fetchUnits();
  }, []);

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'incident_update') {
      fetchIncidents(); // Refresh incidents when we get an update
      fetchActionLogs(); // Refresh action logs
      
      // Show notification for updates
      if (lastMessage.action === 'created') {
        notify.info('New incident created');
      } else if (lastMessage.action === 'updated') {
        notify.info('Incident updated');
      } else if (lastMessage.action === 'dispatched') {
        notify.info('Unit dispatched to incident');
      } else if (lastMessage.action === 'responder_update') {
        notify.info('Responder updated incident status');
      }
    } else if (lastMessage && lastMessage.type === 'unit_update') {
      fetchUnits(); // Refresh units when we get an update
      notify.info('Unit status updated');
    }
  }, [lastMessage]);

  // Check for new incidents and show notifications
  useEffect(() => {
    if (incidents.length > lastIncidentCount && lastIncidentCount > 0) {
      const newIncidents = incidents.length - lastIncidentCount;
      notify.info(`${newIncidents} new incident${newIncidents > 1 ? 's' : ''} received`);
    }
    setLastIncidentCount(incidents.length);
  }, [incidents.length, lastIncidentCount]);

  const fetchUnits = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/units`);
      const data = await response.json();
      const unitIds = (data.units || []).map((unit: any) => unit.id);
      setAvailableUnits(unitIds);
    } catch (error) {
      console.error("Failed to fetch units:", error);
      setAvailableUnits([]);
    }
  };

  const fetchActionLogs = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/actions?limit=20`);
      const data = await response.json();
      setActionLogs(data.actions || []);
    } catch (error) {
      console.error("Failed to fetch action logs:", error);
    }
  };

  const fetchIncidentActionLogs = async (incidentId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}/actions`);
      const data = await response.json();
      setIncidentActionLogs(data.actions || []);
      setShowIncidentActionLogs(true);
    } catch (error) {
      console.error("Failed to fetch incident action logs:", error);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents`);
      const data = await response.json();
      setIncidents(data.incidents || data || []);
    } catch (error) {
      notify.error("Failed to fetch incidents");
    } finally {
      setLoading(false);
    }
  };

  const createIncident = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIncident,
          user: "dispatcher" // Add user info for action logging
        })
      });
      
      if (response.ok) {
        notify.success("Incident created successfully");
        setShowCreateModal(false);
        setNewIncident({ type: "", priority: "medium", location: { lat: 39.8283, lng: -98.5795 }, description: "" });
        fetchIncidents();
        // Highlight and pan to new incident
        const data = await response.json();
        const newId = data.incident_id || (data.incident && data.incident.incident_id);
        if (newId) {
          setSelectedIncidentId(newId);
          const incident = incidents.find(i => i.incident_id === newId);
          if (incident) {
            setMapCenter(incident.location);
            setMapZoom(16);
          }
        }
        setLastCreatedIncidentId(data.incident_id);
        notify.success('Incident created. You can undo this action below.');
      } else {
        notify.error("Failed to create incident");
      }
    } catch (error) {
      notify.error("Failed to create incident");
    }
  };

  const handleDispatchUnit = async () => {
    if (!selectedIncident || dispatchUnits.length === 0) return;
    try {
      for (const unitId of dispatchUnits) {
        await fetch(`${BACKEND_URL}/api/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incident_id: selectedIncident.incident_id,
            unit_id: unitId,
            user: "dispatcher"
          })
        });
      }
      notify.success(`Units ${dispatchUnits.join(', ')} dispatched to incident`);
      setShowDispatchModal(false);
      setSelectedIncident(null);
      setDispatchUnits([]);
      fetchIncidents();
      fetchUnits();
      setMapCenter(selectedIncident.location);
      setMapZoom(16);
    } catch (error) {
      notify.error("Failed to dispatch units");
    }
  };

  const handleRemoveUnitFromIncident = async (incident: Incident, unitName: string) => {
    // Remove from backend if needed (not shown here)
    // Remove from frontend state
    setIncidents(prev => prev.map(i =>
      i.incident_id === incident.incident_id
        ? { ...i, assigned_units: i.assigned_units.filter(u => u !== unitName) }
        : i
    ));
    setUnits(prevUnits => prevUnits.map(u =>
      u.name === unitName && u.destination && incident.location && u.status === 'dispatched'
        ? { ...u, status: 'ready', destination: undefined }
        : u
    ));
  };

  const resolveIncident = async (incidentId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: "resolved",
          user: "dispatcher" // Add user info for action logging
        })
      });
      
      if (response.ok) {
        notify.success("Incident resolved");
        // Clear all units dispatched to this incident
        const incident = incidents.find(i => i.incident_id === incidentId);
        if (incident) {
          setUnits(prevUnits => prevUnits.map(u =>
            incident.assigned_units.includes(u.name)
              ? { ...u, status: 'ready', destination: undefined }
              : u
          ));
        }
        fetchIncidents();
      } else {
        notify.error("Failed to resolve incident");
      }
    } catch (error) {
      notify.error("Failed to resolve incident");
    }
  };

  // Move this helper function up
  const getPriorityNumber = (priority: string) => {
    if (priority === 'high') return 1;
    if (priority === 'medium') return 2;
    if (priority === 'low') return 4;
    const n = parseInt(priority, 10);
    if ([1,2,3,4].includes(n)) return n;
    return 4;
  };

  const filteredIncidents = incidents
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter(incident => {
      if (statusFilter && incident.status !== statusFilter) return false;
      if (priorityFilter && String(getPriorityNumber(incident.priority)) !== priorityFilter) return false;
      return true;
    });

  // Filter incidents for map display - exclude resolved incidents
  const mapIncidents = incidents.filter(incident => incident.status !== "resolved");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-400 bg-red-900/20";
      case "medium": return "text-yellow-400 bg-yellow-900/20";
      case "low": return "text-green-400 bg-green-900/20";
      default: return "text-gray-400 bg-gray-900/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "text-blue-400 bg-blue-900/20";
      case "dispatched": return "text-yellow-400 bg-yellow-900/20";
      case "on_scene": return "text-orange-400 bg-orange-900/20";
      case "resolved": return "text-green-400 bg-green-900/20";
      default: return "text-gray-400 bg-gray-900/20";
    }
  };

  // Table row click handler
  const handleRowClick = (incident: Incident) => {
    setSelectedIncidentId(incident.incident_id);
    setMapCenter(incident.location);
    setMapZoom(16);
    setSelectedIncident(incident);
    setShowIncidentDetailsModal(true);
  };

  // Marker click handler
  const handleIncidentMarkerClick = (incident: Incident) => {
    setSelectedIncidentId(incident.incident_id);
    setMapCenter(incident.location);
    setMapZoom(16);
    setSelectedIncident(incident);
    setShowIncidentDetailsModal(true);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!showCreateModal && e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setModalIncidentLocation({ lat, lng });
      setNewIncident({ ...newIncident, location: { lat, lng } });
      setShowCreateModal(true);
      notify.info('Creating incident at selected location');
    }
  };

  // Undo/cancel after creation
  const handleUndoCreate = async () => {
    if (lastCreatedIncidentId) {
      await fetch(`${BACKEND_URL}/api/incidents/${lastCreatedIncidentId}`, { method: 'DELETE' });
      setLastCreatedIncidentId(null);
      fetchIncidents();
      notify.success('Incident creation undone');
    }
  };

  // Accessibility: focus modal on open
  useEffect(() => {
    if (showCreateModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [showCreateModal]);

  // Edit Incident handler
  const handleEditIncident = (incident: Incident) => {
    setEditIncident({ ...incident });
    setShowEditModal(true);
  };

  const saveEditIncident = async () => {
    if (!editIncident) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${editIncident.incident_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editIncident.type,
          priority: editIncident.priority,
          description: editIncident.description,
          location: editIncident.location,
          user: 'dispatcher',
        })
      });
      if (response.ok) {
        notify.success('Incident updated');
        setShowEditModal(false);
        setEditIncident(null);
        fetchIncidents();
      } else {
        notify.error('Failed to update incident');
      }
    } catch (error) {
      notify.error('Failed to update incident');
    }
  };

  // Debug: Log units whenever they change
  useEffect(() => {
    console.log("Units for map:", units);
  }, [units]);

  return (
    <div className="min-h-screen bg-[#181A1B] text-[#F3F3E7] font-sans">
      {/* Header */}
      <div className="w-full bg-[#23272f] border-b border-[#A3B18A] px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#A3B18A] rounded-lg flex items-center justify-center">
              {/* Sophisticated SVG placeholder icon */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="20" height="20" rx="6" fill="#23272f" stroke="#A3B18A" strokeWidth="2"/>
                <path d="M14 8V16" stroke="#A3B18A" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="14" cy="20" r="1.5" fill="#A3B18A"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-[#F3F3E7]">Incident Management</h1>
              <p className="text-[#A3B18A] text-sm">Real-time incident tracking and unit dispatch</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {isConnected ? '🟢 Connected (Real-time)' : '🔴 Disconnected'}
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors duration-200"
          >
            Create Incident
          </button>
        </div>
      </div>

      {/* Map for Costa Mesa, CA with test data */}
      <div className="flex justify-center mt-6 mb-8">
        <div style={{ width: '700px', height: '420px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px #0006' }}>
          <GoogleOpsMap
            units={units}
            incidents={mapIncidents}
            center={mapCenter}
            zoom={mapZoom}
            selectedIncidentId={selectedIncidentId ?? undefined}
            onIncidentMarkerClick={handleIncidentMarkerClick}
            onMapClick={handleMapClick}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Unit Status Panel */}
        <div className="mb-6">
          <UnitStatusPanel />
        </div>
        
        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#23272f] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="dispatched">Dispatched</option>
            <option value="on_scene">On Scene</option>
            <option value="resolved">Resolved</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-[#23272f] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
          >
            <option value="">All Priorities</option>
            <option value="1">Priority 1 (Highest)</option>
            <option value="2">Priority 2</option>
            <option value="3">Priority 3</option>
            <option value="4">Priority 4 (Lowest)</option>
          </select>

          <button
            onClick={() => setShowActionLogs(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Action Logs ({actionLogs.length})
          </button>
        </div>

        {/* Incidents Table */}
        <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#181A1B] border-b border-[#A3B18A]">
                <tr>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">Location</th>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">Description</th>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">Created</th>
                  <th className="px-6 py-4 text-left text-[#A3B18A] font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-[#A3B18A]">
                      Loading incidents...
                    </td>
                  </tr>
                ) : filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-[#A3B18A]">
                      No incidents found
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => (
                    <tr key={incident.incident_id} className={`border-b border-[#181A1B] hover:bg-[#181A1B]/50 ${selectedIncidentId === incident.incident_id ? 'bg-yellow-900/20' : ''}`} onClick={() => handleRowClick(incident)}>
                      <td className="px-6 py-4 text-sm font-mono text-[#F3F3E7]">
                        {incident.incident_id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-[#F3F3E7]">{incident.type}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold">
                          {getPriorityNumber(incident.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#F3F3E7]">
                        {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-[#F3F3E7] max-w-xs truncate">
                        {incident.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#A3B18A]">
                        {new Date(incident.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {incident.status !== "resolved" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIncident(incident);
                                  setShowDispatchModal(true);
                                }}
                                className="px-3 py-1 bg-[#A3B18A] text-[#181A1B] rounded text-xs font-semibold hover:bg-[#8FA573] transition-colors"
                              >
                                Dispatch
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resolveIncident(incident.incident_id);
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditIncident(incident);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
            aria-label="Create Incident Modal"
            className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6 w-full max-w-md focus:outline-none"
          >
            <h2 className="text-xl font-bold text-[#F3F3E7] mb-4">Create New Incident</h2>
            <div className="space-y-4">
              {/* Incident Type and Icon Preview */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Incident Type (e.g. Hazard, Shooting)"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({...newIncident, type: e.target.value})}
                  className="flex-1 px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
                />
                {/* Icon preview for type */}
                {newIncident.type &&
                  (['hazard', 'shooting', 'fire', 'accident'].includes(newIncident.type.toLowerCase()) ? (
                    <img
                      src={newIncident.type.toLowerCase() === 'hazard' ? '/hazard-icon.svg' : '/incident-icon.svg'}
                      alt="Incident Icon Preview"
                      className="w-8 h-8"
                    />
                  ) : null)
                }
              </div>
              {/* Priority 1-4 Dropdown */}
              <div>
                <select
                  value={newIncident.priority}
                  onChange={(e) => setNewIncident({...newIncident, priority: e.target.value})}
                  className="w-full px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
                >
                  <option value="1">Priority 1 (Critical - e.g. Shooting)</option>
                  <option value="2">Priority 2 (High - e.g. Major Accident)</option>
                  <option value="3">Priority 3 (Moderate - e.g. Disturbance)</option>
                  <option value="4">Priority 4 (Minor - e.g. Traffic Stop)</option>
                </select>
                <div className="text-xs text-[#A3B18A] mt-1">1 = Highest, 4 = Lowest</div>
              </div>
              {/* Map Picker for Location */}
              <div>
                <div className="mb-2 text-xs text-[#A3B18A]">Pick location:</div>
                <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden' }}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '180px' }}
                    center={modalIncidentLocation}
                    zoom={15}
                    onClick={e => {
                      if (e.latLng) {
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setModalIncidentLocation({ lat, lng });
                        setNewIncident({ ...newIncident, location: { lat, lng } });
                      }
                    }}
                  >
                    <Marker
                      position={modalIncidentLocation}
                      draggable={true}
                      onDragEnd={e => {
                        if (e.latLng) {
                          const lat = e.latLng.lat();
                          const lng = e.latLng.lng();
                          setModalIncidentLocation({ lat, lng });
                          setNewIncident({ ...newIncident, location: { lat, lng } });
                        }
                      }}
                    />
                  </GoogleMap>
                </div>
              </div>
              <textarea
                placeholder="Description"
                value={newIncident.description}
                onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                className="w-full px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7] h-24"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createIncident}
                className="flex-1 px-4 py-2 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-[#181A1B] text-[#F3F3E7] rounded-lg font-semibold hover:bg-[#2A2F3A] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#F3F3E7] mb-4">Dispatch Units</h2>
            <p className="text-[#A3B18A] mb-4">
              Assign units to incident: {selectedIncident.type}
            </p>
            <select
              multiple
              value={dispatchUnits}
              onChange={e => setDispatchUnits(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7] mb-4"
              size={Math.min(availableUnits.length, 6)}
            >
              {availableUnits.map(unitId => (
                <option key={unitId} value={unitId}>{unitId}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleDispatchUnit}
                disabled={dispatchUnits.length === 0}
                className="flex-1 px-4 py-2 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors disabled:opacity-50"
              >
                Dispatch
              </button>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="flex-1 px-4 py-2 bg-[#181A1B] text-[#F3F3E7] rounded-lg font-semibold hover:bg-[#2A2F3A] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {showIncidentDetailsModal && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#F3F3E7]">Incident Details</h2>
              <button
                onClick={() => setShowIncidentDetailsModal(false)}
                className="text-[#A3B18A] hover:text-[#F3F3E7] transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Incident ID */}
              <div className="flex items-center gap-2">
                <span className="text-[#A3B18A] font-semibold w-24">ID:</span>
                <span className="text-[#F3F3E7] font-mono text-sm">{selectedIncident.incident_id}</span>
              </div>

              {/* Type and Icon */}
              <div className="flex items-center gap-2">
                <span className="text-[#A3B18A] font-semibold w-24">Type:</span>
                <span className="text-[#F3F3E7]">{selectedIncident.type}</span>
                <img
                  src={selectedIncident.type.toLowerCase() === 'hazard' ? '/hazard-icon.svg' : '/incident-icon.svg'}
                  alt="Incident Icon"
                  className="w-6 h-6 ml-2"
                />
              </div>

              {/* Priority */}
              <div className="flex items-center gap-2">
                <span className="text-[#A3B18A] font-semibold w-24">Priority:</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold">
                  {getPriorityNumber(selectedIncident.priority)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-[#A3B18A] font-semibold w-24">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <span className="text-[#A3B18A] font-semibold w-24">Location:</span>
                <span className="text-[#F3F3E7]">
                  {selectedIncident.location.lat.toFixed(6)}, {selectedIncident.location.lng.toFixed(6)}
                </span>
              </div>

              {/* Description */}
              <div>
                <span className="text-[#A3B18A] font-semibold block mb-2">Description:</span>
                <p className="text-[#F3F3E7] bg-[#181A1B] p-3 rounded-lg border border-[#A3B18A]/20">
                  {selectedIncident.description || "No description provided"}
                </p>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-2">
                <span className="text-[#A3B18A] font-semibold w-24">Created:</span>
                <span className="text-[#F3F3E7]">
                  {new Date(selectedIncident.created_at).toLocaleString()}
                </span>
              </div>

              {/* Resolved At (if resolved) */}
              {selectedIncident.resolved_at && (
                <div className="flex items-center gap-2">
                  <span className="text-[#A3B18A] font-semibold w-24">Resolved:</span>
                  <span className="text-[#F3F3E7]">
                    {new Date(selectedIncident.resolved_at).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Assigned Units */}
              <div>
                <span className="text-[#A3B18A] font-semibold block mb-2">Assigned Units:</span>
                {selectedIncident.assigned_units && selectedIncident.assigned_units.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.assigned_units.map((unit, index) => (
                      <span key={index} className="px-2 py-1 bg-[#A3B18A]/20 text-[#A3B18A] rounded text-sm flex items-center gap-1">
                        {unit}
                        <button
                          className="ml-1 text-red-400 hover:text-red-600 text-xs font-bold"
                          title="Remove unit from incident"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveUnitFromIncident(selectedIncident, unit);
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#A3B18A] italic">No units assigned</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[#A3B18A]/20">
              <button
                onClick={() => fetchIncidentActionLogs(selectedIncident.incident_id)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                View History
              </button>
              {selectedIncident.status !== "resolved" && (
                <>
                  <button
                    onClick={() => {
                      setShowIncidentDetailsModal(false);
                      handleEditIncident(selectedIncident);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Edit Incident
                  </button>
                  <button
                    onClick={() => {
                      setShowIncidentDetailsModal(false);
                      setShowDispatchModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-[#A3B18A] text-[#181A1B] rounded-lg font-semibold hover:bg-[#8FA573] transition-colors"
                  >
                    Dispatch Units
                  </button>
                  <button
                    onClick={() => {
                      resolveIncident(selectedIncident.incident_id);
                      setShowIncidentDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Resolve Incident
                  </button>
                </>
              )}
              <button
                onClick={() => setShowIncidentDetailsModal(false)}
                className="flex-1 px-4 py-2 bg-[#181A1B] text-[#F3F3E7] rounded-lg font-semibold hover:bg-[#2A2F3A] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* After the table or map, show Undo button if lastCreatedIncidentId is set */}
      {lastCreatedIncidentId && (
        <div className="mt-2 text-center">
          <button onClick={handleUndoCreate} className="underline text-red-400">Undo Last Incident Creation</button>
        </div>
      )}

      {/* Action Logs Modal */}
      {showActionLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#F3F3E7]">Action Logs</h2>
              <button
                onClick={() => setShowActionLogs(false)}
                className="text-[#A3B18A] hover:text-[#F3F3E7] transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {actionLogs.length === 0 ? (
                <p className="text-[#A3B18A] text-center py-8">No actions logged yet</p>
              ) : (
                actionLogs.map((log, index) => (
                  <div key={index} className="bg-[#181A1B] p-4 rounded-lg border border-[#A3B18A]/20">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          log.action === 'created' ? 'bg-green-900/20 text-green-400' :
                          log.action === 'updated' ? 'bg-blue-900/20 text-blue-400' :
                          log.action === 'dispatched' ? 'bg-yellow-900/20 text-yellow-400' :
                          'bg-gray-900/20 text-gray-400'
                        }`}>
                          {log.action.toUpperCase()}
                        </span>
                        <span className="text-[#F3F3E7] font-semibold">
                          Incident {log.incident_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[#A3B18A] text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="text-[#A3B18A] text-xs">
                          by {log.user}
                        </div>
                      </div>
                    </div>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
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
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
                <p className="text-[#A3F3E7] text-center py-8">No history available for this incident</p>
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

      {/* Edit Incident Modal */}
      {showEditModal && editIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#23272f] rounded-2xl border border-[#A3B18A] p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#F3F3E7] mb-4">Edit Incident</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Incident Type"
                value={editIncident.type}
                onChange={e => setEditIncident({ ...editIncident, type: e.target.value })}
                className="w-full px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
              />
              <select
                value={editIncident.priority}
                onChange={e => setEditIncident({ ...editIncident, priority: e.target.value })}
                className="w-full px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
              >
                <option value="1">Priority 1 (Critical)</option>
                <option value="2">Priority 2 (High)</option>
                <option value="3">Priority 3 (Moderate)</option>
                <option value="4">Priority 4 (Minor)</option>
              </select>
              <textarea
                placeholder="Description"
                value={editIncident.description}
                onChange={e => setEditIncident({ ...editIncident, description: e.target.value })}
                className="w-full px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7] h-24"
              />
              <div>
                <div className="mb-2 text-xs text-[#A3B18A]">Edit location:</div>
                <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden' }}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '180px' }}
                    center={editIncident.location}
                    zoom={15}
                    onClick={e => {
                      if (e.latLng) {
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setEditIncident({ ...editIncident, location: { lat, lng } });
                      }
                    }}
                  >
                    <Marker
                      position={editIncident.location}
                      draggable={true}
                      onDragEnd={e => {
                        if (e.latLng) {
                          const lat = e.latLng.lat();
                          const lng = e.latLng.lng();
                          setEditIncident({ ...editIncident, location: { lat, lng } });
                        }
                      }}
                    />
                  </GoogleMap>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveEditIncident}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-[#181A1B] text-[#F3F3E7] rounded-lg font-semibold hover:bg-[#2A2F3A] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 