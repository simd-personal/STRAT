import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '400px' };
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
}: {
  units: any[];
  incidents: any[];
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedIncidentId?: string;
  onIncidentMarkerClick?: (incident: any) => void;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ ...containerStyle, maxWidth: '100vw', maxHeight: '60vh' }}
      center={center}
      zoom={zoom}
      onClick={onMapClick}
      options={{
        gestureHandling: 'greedy',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      }}
      // Accessibility: consider wrapping in a focusable div if keyboard navigation is needed
    >
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
  );
} 