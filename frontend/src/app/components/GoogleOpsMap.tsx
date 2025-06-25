import { GoogleMap, Marker, Polyline, useJsApiLoader, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import React from 'react';

const containerStyle = { 
  width: '100%', 
  height: '600px',
  position: 'relative',
  zIndex: 1
};
const defaultCenter = { lat: 39.8283, lng: -98.5795 };
const defaultZoom = 5;

export default function GoogleOpsMap({
  units,
  incidents,
  center = defaultCenter,
  zoom = defaultZoom,
  selectedIncidentId,
  onIncidentMarkerClick,
  onMapClick,
  missionLocation,
}: {
  units: any[];
  incidents: any[];
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedIncidentId?: string;
  onIncidentMarkerClick?: (incident: any) => void;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  missionLocation?: { lat: number; lng: number } | null;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  // Store directions for each unit by unit.id
  const [directions, setDirections] = useState<{ [unitId: string]: any }>({});

  useEffect(() => {
    // Clear directions for units that are no longer dispatched
    setDirections(prev => {
      const newDirections: { [unitId: string]: any } = {};
      units.forEach(u => {
        if (u.status === 'dispatched' && u.destination) {
          if (prev[u.id]) newDirections[u.id] = prev[u.id];
        }
      });
      return newDirections;
    });
  }, [units]);

  const handleDirectionsCallback = (unitId: string, result: any, status: any) => {
    if (status === 'OK' && result) {
      setDirections(prev => ({ ...prev, [unitId]: result }));
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="map-container" style={{ position: 'relative', zIndex: 1, contain: 'layout' }}>
      <GoogleMap
        mapContainerStyle={{ 
          ...containerStyle, 
          maxWidth: '100vw', 
          maxHeight: '80vh',
          position: 'relative',
          zIndex: 1,
          contain: 'layout'
        }}
        center={center}
        zoom={zoom}
        onClick={onMapClick}
        options={{
          gestureHandling: 'greedy',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          zoomControl: true,
          scaleControl: true,
        }}
        // Accessibility: consider wrapping in a focusable div if keyboard navigation is needed
      >
        {/* Draw real routes for dispatched units */}
        {units.filter(u => u.status === 'dispatched' && u.destination).map((unit, idx) => (
          <React.Fragment key={unit.id}>
            {!directions[unit.id] && (
              <DirectionsService
                key={`ds-${unit.id}`}
                options={{
                  origin: unit.position,
                  destination: unit.destination,
                  travelMode: google.maps.TravelMode.DRIVING,
                }}
                callback={(result, status) => handleDirectionsCallback(unit.id, result, status)}
              />
            )}
            {directions[unit.id] && (
              <DirectionsRenderer
                key={`dr-${unit.id}`}
                directions={directions[unit.id]}
                options={{
                  polylineOptions: {
                    strokeColor: '#1976D2',
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                    zIndex: 2,
                  },
                  suppressMarkers: true,
                }}
              />
            )}
          </React.Fragment>
        ))}
        {/* Draw unit markers */}
        {units.map((unit, idx) => (
          <Marker
            key={unit.id || unit.asset_id || idx}
            position={unit.position}
            label={{
              text: `${idx + 1}`,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
            icon={{
              url: '/car-icon.svg',
              scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(32, 32) : undefined,
            }}
          />
        ))}
        {/* Draw incident markers */}
        {incidents.map((incident) => (
          <Marker
            key={incident.incident_id}
            position={incident.location}
            icon={{
              url:
                incident.incident_id === selectedIncidentId
                  ? (incident.type === 'Hazard' ? '/hazard-icon-pulse.svg' : '/incident-icon-pulse.svg')
                  : (incident.type === 'Hazard' ? '/hazard-icon.svg' : '/incident-icon.svg'),
              scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(36, 36) : undefined,
            }}
            onClick={() => onIncidentMarkerClick && onIncidentMarkerClick(incident)}
          />
        ))}
      </GoogleMap>
    </div>
  );
} 