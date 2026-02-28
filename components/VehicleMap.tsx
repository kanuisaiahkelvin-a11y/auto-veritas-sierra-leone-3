
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Vehicle } from '../types';

// Fix for default marker icon in Leaflet with React
// We use CDN links for icons to avoid build issues with local assets in some environments
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface VehicleMapProps {
  vehicles: Vehicle[];
}

const VehicleMap: React.FC<VehicleMapProps> = ({ vehicles }) => {
  const center: [number, number] = [8.484, -13.234]; // Freetown

  const vehiclesWithTickets = vehicles.filter(v => 
    v.violationHistory.some(vh => vh.toLowerCase().includes('ticket')) && v.location
  );

  return (
    <div className="h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 relative z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehiclesWithTickets.map((vehicle) => (
          <Marker 
            key={vehicle.vin} 
            position={[vehicle.location!.lat, vehicle.location!.lng]}
          >
            <Popup>
              <div className="p-2 font-sans">
                <h3 className="font-black text-slate-900 text-lg tracking-tight">{vehicle.plateNumber}</h3>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">{vehicle.make} {vehicle.model}</p>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Active Ticket Violations:</p>
                  <ul className="text-xs space-y-1">
                    {vehicle.violationHistory.filter(vh => vh.toLowerCase().includes('ticket')).map((v, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700 font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex justify-between items-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase">Last Sync: {new Date(vehicle.location!.lastUpdated).toLocaleTimeString()}</span>
                   <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black uppercase">Enforcement Required</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default VehicleMap;
