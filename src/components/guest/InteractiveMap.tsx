import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Shelter } from '../../types/index.ts';
import { useUserLocation } from '../../hooks/useUserLocation.ts';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Custom icons for different shelter statuses
const getShelterIcon = (status: 'open' | 'limited' | 'full', isHighlighted: boolean = false) => {
  const colors = {
    open: '#10b981',
    limited: '#f59e0b',
    full: '#ef4444',
  };
  
  const size = isHighlighted ? 48 : 32;
  const strokeWidth = isHighlighted ? 3 : 2;
  const fontSize = isHighlighted ? 24 : 16;
  
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${isHighlighted ? `
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
          </defs>
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${colors[status]}" opacity="0.3" filter="url(#glow)">
            <animate attributeName="r" values="${size/2 - 2};${size/2 + 2};${size/2 - 2}" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
        <path d="M${size/2} ${size/16} L${size*7/8} ${size*5/16} L${size*7/8} ${size*13/16} L${size/2} ${size} L${size/8} ${size*13/16} L${size/8} ${size*5/16} Z" 
              fill="${colors[status]}" 
              stroke="white" 
              stroke-width="${strokeWidth}"
              ${isHighlighted ? 'filter="url(#glow)"' : ''}/>
        <text x="${size/2}" y="${size*13/16}" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="bold">S</text>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size],
    className: isHighlighted ? 'highlighted-marker' : '',
  });
};

type MapControllerProps = {
  userLocation: { latitude: number; longitude: number } | null;
  highlightedId?: string;
  shelters: Shelter[];
};

// Component to handle map view updates
const MapController = ({ userLocation, highlightedId, shelters }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (highlightedId) {
      const shelter = shelters.find(s => s.id === highlightedId);
      if (shelter) {
        map.flyTo([shelter.location.latitude, shelter.location.longitude], 15, {
          duration: 1,
        });
      }
    } else if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [map, userLocation, highlightedId, shelters]);

  return null;
};

type InteractiveMapProps = {
  shelters: Shelter[];
  highlightedId?: string;
  onSelect?: (shelterId: string) => void;
};

export const InteractiveMap = ({ shelters, highlightedId, onSelect }: InteractiveMapProps) => {
  const { location: userLocation, error, isLoading } = useUserLocation();
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

  const center: [number, number] = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    // Default to Chicago if no user location
    return [41.8781, -87.6298];
  }, [userLocation]);

  // Auto-open popup for highlighted shelter and close others
  useEffect(() => {
    // Close all popups first
    Object.values(markerRefs.current).forEach((marker) => {
      marker?.closePopup();
    });
    
    // Open popup for highlighted shelter
    if (highlightedId && markerRefs.current[highlightedId]) {
      markerRefs.current[highlightedId]?.openPopup();
    }
  }, [highlightedId]);

  if (isLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
        <div className="text-center">
          <div className="mb-2 text-slate-400">Loading map...</div>
          <div className="text-xs text-slate-500">Requesting location permission</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
        <div className="text-center">
          <div className="mb-2 text-slate-400">Unable to access location</div>
          <div className="text-xs text-slate-500">{error}</div>
          <div className="mt-2 text-xs text-slate-600">Showing default location</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-lg">
      <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-slate-900/90 px-3 py-2 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Live Map</p>
        <p className="text-xs text-slate-300">
          {shelters.length} shelter{shelters.length !== 1 ? 's' : ''} nearby
        </p>
      </div>
      
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-[500px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          userLocation={userLocation} 
          highlightedId={highlightedId}
          shelters={shelters}
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-blue-600">Your Location</p>
                <p className="text-xs text-slate-600">
                  Accuracy: ±{Math.round(userLocation.accuracy)}m
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Shelter markers */}
        {shelters.map((shelter) => (
          <Marker
            key={shelter.id}
            position={[shelter.location.latitude, shelter.location.longitude]}
            icon={getShelterIcon(shelter.availability.status, highlightedId === shelter.id)}
            eventHandlers={{
              click: () => onSelect?.(shelter.id),
            }}
            zIndexOffset={highlightedId === shelter.id ? 1000 : 0}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[shelter.id] = ref;
              }
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="mb-1 font-semibold text-slate-900">{shelter.name}</h3>
                <p className="mb-2 text-xs text-slate-600">{shelter.location.address}</p>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Distance:</span>
                    <span className="font-medium">{shelter.distanceMiles.toFixed(1)} miles</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Beds Available:</span>
                    <span className="font-medium">{shelter.availability.bedsAvailable}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className={`font-medium ${
                      shelter.availability.status === 'open' ? 'text-green-600' :
                      shelter.availability.status === 'limited' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {shelter.availability.status.toUpperCase()}
                    </span>
                  </div>
                  {shelter.availability.meals && (
                    <div className="mt-2 border-t border-slate-200 pt-1">
                      <span className="text-slate-600">Meals: </span>
                      <span>{shelter.availability.meals}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
