import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Definimos los colores exactos del diseño
const categoryColors = {
  baches:       '#EF4444',
  alumbrado:    '#8B5CF6',
  residuos:     '#88cc00',
  construccion: '#FACC15',
  extravios:    '#0EA5E9',
  otros:        '#6B7280',
  default:      '#7C3AED',
};

const createCustomIcon = (category) => {
  const color = categoryColors[category] || categoryColors.default;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export const ReportMap = ({ reports, center = [-31.4201, -64.1888], zoom = 13 }) => {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {reports && reports.map((report) => (
        <Marker 
          key={report.id} 
          position={[report.latitude, report.longitude]} 
          icon={createCustomIcon(report.category)} // <--- Aquí pasamos la categoría
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold">{report.title}</h3>
              <p className="text-xs uppercase font-bold" style={{ color: categoryColors[report.category] }}>
                {report.category}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};