import React from 'react';
import { MapPin, User as UserIcon, Calendar } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const CATEGORY_COLORS = {
  baches:       '#EF4444',
  residuos:     '#88cc00',
  alumbrado:    '#8B5CF6',
  construccion: '#FACC15',
  extravios:    '#0EA5E9',
  otros:        '#6B7280',
};

const STATUS_CLASSES = {
  pending:  'bg-amber-500',
  resolved: 'bg-emerald-500',
};

export const ReportCard = ({ report }) => {
  const imageSrc = report.image_path 
    ? `${BACKEND_URL}/api/files/${report.image_path}` 
    : 'https://images.unsplash.com/photo-1580319978358-045c4fdccd16?w=400';

  return (
    <div className="border border-gray-200 bg-white hover:border-primary transition-all overflow-hidden shadow-sm">
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        <img src={imageSrc} alt={report.title} className="w-full h-full object-cover" />
      </div>
      
      <div className="p-4">
        {/* Etiquetas de Categoría y Estado */}
        <div className="flex gap-2 mb-3">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: CATEGORY_COLORS[report.category] || '#6B7280' }}>
            {report.category}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${STATUS_CLASSES[report.status]}`}>
            {report.status === 'pending' ? 'Pendiente' : 'Resuelto'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{report.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{report.description}</p>
        
        <div className="space-y-1 text-[11px] text-gray-400 font-medium">
          <div className="flex items-center gap-1">
            <MapPin size={14} weight="bold" className="text-primary" />
            <span className="line-clamp-1">{report.address}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <UserIcon size={14} weight="bold" />
              <span>{report.user_name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};