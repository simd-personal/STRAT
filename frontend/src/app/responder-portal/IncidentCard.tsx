"use client";
import { useState, useEffect, useRef } from 'react';
import GoogleMapReact from 'google-map-react';

interface MarkerProps { lat: number; lng: number; }
const UnitMarker = (props: MarkerProps) => <span role="img" aria-label="unit" style={{ fontSize: 32 }}>🚓</span>;
const IncidentMarker = (props: MarkerProps) => <span role="img" aria-label="incident" style={{ fontSize: 32 }}>📍</span>;

interface IncidentCardProps {
  incident: any;
  unitLocation: { lat: number; lng: number } | null;
  isAssigned: boolean;
  unit: string;
  showDirections?: boolean;
  children: React.ReactNode;
}

export default function IncidentCard({ incident, unitLocation, isAssigned, unit, showDirections, children }: IncidentCardProps) {
  const directionsRendererRef = useRef<any>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);

  const handleApiLoaded = ({ map, maps }: { map: google.maps.Map; maps: typeof google.maps }) => {
    if (isAssigned && unitLocation) {
      const directionsService = new maps.DirectionsService();
      directionsService.route(
        {
          origin: unitLocation,
          destination: incident.location,
          travelMode: maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === 'OK') {
            if (directionsRendererRef.current) {
              directionsRendererRef.current.setMap(null);
            }
            directionsRendererRef.current = new maps.DirectionsRenderer({
              map,
              directions: result,
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#A3B18A', strokeWeight: 5 },
            });
            // Extract ETA and steps
            if (showDirections && result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
              const leg = result.routes[0].legs[0];
              setEta(leg.duration?.text || null);
              setSteps(leg.steps?.map((step: any) => step.instructions.replace(/<[^>]+>/g, '')) || []);
            }
          }
        }
      );
    }
  };

  // Debug prints
  console.log('IncidentCard:', {
    incidentId: incident.incident_id,
    unitLocation,
    incidentLocation: incident.location,
    isAssigned
  });

  return (
    <li className="bg-[#181A1B] rounded-lg p-4 border border-[#A3B18A]/30 mb-4">
      {children}
      {isAssigned && unitLocation ? (
        <div className="my-4">
          <div style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <GoogleMapReact
              bootstrapURLKeys={{ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' }}
              defaultCenter={unitLocation}
              defaultZoom={14}
              yesIWantToUseGoogleMapApiInternals
              onGoogleApiLoaded={handleApiLoaded}
            >
              <UnitMarker lat={unitLocation.lat} lng={unitLocation.lng} />
              <IncidentMarker lat={incident.location.lat} lng={incident.location.lng} />
            </GoogleMapReact>
          </div>
          {showDirections && eta && (
            <div className="mt-2 text-green-400 text-sm font-semibold">ETA: {eta}</div>
          )}
          {showDirections && steps.length > 0 && (
            <ol className="mt-2 text-xs text-[#A3B18A] list-decimal list-inside space-y-1">
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      ) : isAssigned ? (
        <div className="my-4 text-yellow-400 text-sm">No location available for this unit.</div>
      ) : null}
    </li>
  );
} 