"use client";

import { useState, useEffect, useRef } from "react";
import { notify } from "../../components/notify";
import GoogleOpsMap from '../../components/GoogleOpsMap';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface Incident {
  incident_id: string;
  type: string;
  priority: string;
  location: { lat: number; lng: number };
  status: "new" | "dispatched" | "resolved";
  description: string;
  created_at: string;
  resolved_at?: string;
  assigned_units: string[];
}

const BACKEND_URL = 'http://localhost:8000';

// Test data for demo map
const TEST_UNITS = [
  { id: 'unit1', position: { lat: 33.646, lng: -117.918 }, status: 'ready', name: 'Unit 1' },
  { id: 'unit2', position: { lat: 33.638, lng: -117.926 }, status: 'ready', name: 'Unit 2' },
  { id: 'unit3', position: { lat: 33.635, lng: -117.912 }, status: 'ready', name: 'Unit 3' },
  { id: 'unit4', position: { lat: 33.642, lng: -117.930 }, status: 'ready', name: 'Unit 4' },
];
const TEST_INCIDENTS = [
  { incident_id: 'hazard1', type: 'Hazard', priority: 'high', location: { lat: 33.6411, lng: -117.9187 }, status: 'new', description: 'Chemical spill reported', created_at: new Date().toISOString(), assigned_units: [] },
];

export default function IncidentManagement() {
  // Restore backend state for incidents
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 33.6411, lng: -117.9187 });
  const [mapZoom, setMapZoom] = useState(14);
  const mapRef = useRef<any>(null);
  
  // Form states
  const [newIncident, setNewIncident] = useState({
    type: "",
    priority: "medium",
    location: { lat: 39.8283, lng: -98.5795 },
    description: ""
  });
  const [dispatchUnit, setDispatchUnit] = useState("");

  // Available units (mock data - replace with real asset data)
  const availableUnits = [
    "Alpha-1", "Alpha-2", "Bravo-1", "Bravo-2", 
    "Charlie-1", "Delta-1", "Echo-1", "Foxtrot-1"
  ];

  const [modalIncidentLocation, setModalIncidentLocation] = useState({ lat: 33.6411, lng: -117.9187 });

  // Undo/cancel after creation
  const [lastCreatedIncidentId, setLastCreatedIncidentId] = useState<string | null>(null);

  // Accessibility: focus modal on open
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

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
        body: JSON.stringify(newIncident)
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
    if (!selectedIncident || !dispatchUnit) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.incident_id,
          unit_id: dispatchUnit
        })
      });
      
      if (response.ok) {
        notify.success(`Unit ${dispatchUnit} dispatched to incident`);
        setShowDispatchModal(false);
        setSelectedIncident(null);
        setDispatchUnit("");
        fetchIncidents();
      } else {
        notify.error("Failed to dispatch unit");
      }
    } catch (error) {
      notify.error("Failed to dispatch unit");
    }
  };

  const resolveIncident = async (incidentId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "resolved" })
      });
      
      if (response.ok) {
        notify.success("Incident resolved");
        fetchIncidents();
      } else {
        notify.error("Failed to resolve incident");
      }
    } catch (error) {
      notify.error("Failed to resolve incident");
    }
  };

  const filteredIncidents = incidents
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter(incident => {
      if (statusFilter && incident.status !== statusFilter) return false;
      if (priorityFilter && incident.priority !== priorityFilter) return false;
      return true;
    });

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
      case "resolved": return "text-green-400 bg-green-900/20";
      default: return "text-gray-400 bg-gray-900/20";
    }
  };

  // Table row click handler
  const handleRowClick = (incident: Incident) => {
    setSelectedIncidentId(incident.incident_id);
    setMapCenter(incident.location);
    setMapZoom(16);
  };

  // Marker click handler
  const handleIncidentMarkerClick = (incident: Incident) => {
    setSelectedIncidentId(incident.incident_id);
    setMapCenter(incident.location);
    setMapZoom(16);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!showCreateModal && e.latLng) {
      setModalIncidentLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      setNewIncident({ ...newIncident, location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
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

  return (
    <div className="min-h-screen bg-[#181A1B] text-[#F3F3E7] font-sans">
      {/* Header */}
      <div className="w-full bg-[#23272f] border-b border-[#A3B18A] px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#A3B18A] rounded-lg flex items-center justify-center">
              <span className="text-[#181A1B] font-bold text-lg">🚨</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-[#F3F3E7]">Incident Management</h1>
              <p className="text-[#A3B18A] text-sm">Real-time incident tracking and unit dispatch</p>
            </div>
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
        <div style={{ width: '500px', height: '300px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px #0006' }}>
          <GoogleOpsMap
            units={TEST_UNITS}
            incidents={incidents}
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
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#23272f] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-[#23272f] border border-[#A3B18A] rounded-lg text-[#F3F3E7]"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(incident.priority)}`}>
                          {incident.priority}
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
                {newIncident.type && (
                  <img
                    src={newIncident.type.toLowerCase() === 'hazard' ? '/hazard-icon.svg' : '/incident-icon.svg'}
                    alt="Incident Icon Preview"
                    className="w-8 h-8"
                  />
                )}
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
            <h2 className="text-xl font-bold text-[#F3F3E7] mb-4">Dispatch Unit</h2>
            <p className="text-[#A3B18A] mb-4">
              Assign a unit to incident: {selectedIncident.type}
            </p>
            <select
              value={dispatchUnit}
              onChange={(e) => setDispatchUnit(e.target.value)}
              className="w-full px-4 py-2 bg-[#181A1B] border border-[#A3B18A] rounded-lg text-[#F3F3E7] mb-4"
            >
              <option value="">Select Unit</option>
              {availableUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleDispatchUnit}
                disabled={!dispatchUnit}
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

      {/* After the table or map, show Undo button if lastCreatedIncidentId is set */}
      {lastCreatedIncidentId && (
        <div className="mt-2 text-center">
          <button onClick={handleUndoCreate} className="underline text-red-400">Undo Last Incident Creation</button>
        </div>
      )}
    </div>
  );
} 