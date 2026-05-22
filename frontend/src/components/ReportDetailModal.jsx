// src/components/ReportDetailModal.jsx
import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../data/landingData';
import { MapPinIcon, ClockIcon, UserIcon, CheckIcon } from './Icons';

function MetaCell({ label, value, icon, span }) {
  return (
    <div className={`bg-white p-4 ${span === 2 ? 'col-span-2' : ''}`}>
      <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5 flex items-center gap-1.5">
        <span className="text-neutral-500">{icon}</span>
        {label}
      </div>
      <div className="text-[13px] font-medium text-neutral-900 leading-snug">{value}</div>
    </div>
  );
}

function VoteButtons({ score, userVote, onVote }) {
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  return (
    <div className="flex items-center gap-1 select-none" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => onVote('up')} aria-label="Votar a favor" aria-pressed={userVote === 'up'}
        className={`w-8 h-8 flex items-center justify-center border transition-colors
          ${userVote === 'up' ? 'bg-[#F97316] border-[#F97316] text-white' : 'border-neutral-300 text-neutral-400 hover:text-[#F97316] hover:border-[#F97316]'}`}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 14 12 8 18 14"/>
        </svg>
      </button>
      <span className={`text-[13px] font-bold tabular-nums min-w-[28px] text-center
        ${userVote === 'up' ? 'text-[#F97316]' : userVote === 'down' ? 'text-[#6366F1]' : 'text-neutral-700'}`}>
        {fmt(score)}
      </span>
      <button type="button" onClick={() => onVote('down')} aria-label="Votar en contra" aria-pressed={userVote === 'down'}
        className={`w-8 h-8 flex items-center justify-center border transition-colors
          ${userVote === 'down' ? 'bg-[#6366F1] border-[#6366F1] text-white' : 'border-neutral-300 text-neutral-400 hover:text-[#6366F1] hover:border-[#6366F1]'}`}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 10 12 16 18 10"/>
        </svg>
      </button>
    </div>
  );
}

export default function ReportDetailModal({ report, onClose, vote, onVote }) {
  const cat = CATEGORIES.find((c) => c.id === report.category) || CATEGORIES[3];
  const statusTone = report.status === 'pending' ? '#F59E0B' : '#10B981';
  const statusLabel = report.status === 'pending' ? 'Pendiente' : 'Resuelto';
  const photos = (report.images?.length ? report.images : [report.image]).filter(Boolean);

  const [activePhoto, setActivePhoto] = useState(0);
  const [imgError, setImgError] = useState({});

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;
    const map = window.L.map(mapRef.current, {
      center: [report.latitude, report.longitude],
      zoom: 16, zoomControl: false, attributionControl: false,
      scrollWheelZoom: false, dragging: true,
    });
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    const icon = window.L.divIcon({
      className: 'custom-marker-icon',
      html: `<div style="position:relative;width:32px;height:32px;">
        <span style="position:absolute;inset:0;border-radius:50%;background:${cat.color};opacity:0.25;animation:iv-pulse 1.8s ease-out infinite;"></span>
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;background:${cat.color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);"></span>
      </div>`,
      iconSize: [32, 32], iconAnchor: [16, 16],
    });
    window.L.marker([report.latitude, report.longitude], { icon }).addTo(map);
    setTimeout(() => map.invalidateSize(), 50);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [report.id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8"
         style={{ background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(2px)' }}
         onClick={onClose}>
      <style>{`
        @keyframes iv-pulse { 0% { transform: scale(0.6); opacity: 0.55; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes iv-modal-in { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .custom-marker-icon { background: transparent; border: none; }
      `}</style>
      <div
        className="relative bg-white border border-neutral-200 w-full max-w-[1100px] max-h-[92vh] overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]"
        style={{ animation: 'iv-modal-in 180ms ease-out' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={report.title}>

        {/* LEFT — gallery */}
        <div className="col-span-1 lg:col-span-7 bg-neutral-950 flex flex-col">
          <div className="relative flex-1 flex items-center justify-center min-h-[280px] lg:min-h-[420px] overflow-hidden">
            {photos.length === 0 || imgError[activePhoto] ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                   style={{ backgroundImage: `repeating-linear-gradient(45deg, ${cat.color}22, ${cat.color}22 8px, ${cat.color}0d 8px, ${cat.color}0d 16px)` }}>
                <svg className="w-10 h-10 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span className="text-white/50 text-[11px] font-mono">Sin foto adjunta</span>
              </div>
            ) : (
              <img src={photos[activePhoto]} alt={`${report.title} — foto ${activePhoto + 1}`}
                className="w-full h-full object-cover"
                onError={() => setImgError((s) => ({ ...s, [activePhoto]: true }))}/>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: cat.color }}>{cat.label}</span>
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: statusTone }}>{statusLabel}</span>
            </div>
            {photos.length > 0 && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/55 text-white text-[10px] font-mono tracking-wider">
                {activePhoto + 1} / {photos.length}
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button onClick={() => setActivePhoto((p) => (p - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/55 text-white hover:bg-black/80 flex items-center justify-center transition-colors" aria-label="Foto anterior">‹</button>
                <button onClick={() => setActivePhoto((p) => (p + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/55 text-white hover:bg-black/80 flex items-center justify-center transition-colors" aria-label="Foto siguiente">›</button>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-1.5 p-2 border-t border-neutral-800 bg-neutral-900">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setActivePhoto(i)}
                  className={`w-14 h-14 flex-shrink-0 overflow-hidden border-2 transition-all ${activePhoto === i ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={p} alt="" className="w-full h-full object-cover"
                       onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.style.background = cat.color; }}/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — info */}
        <div className="col-span-1 lg:col-span-5 flex flex-col bg-white max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between p-5 border-b border-neutral-200">
            <div className="min-w-0 pr-3 flex-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400 mb-1.5">Reporte #{report.id.toUpperCase()}</div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-heading font-bold text-[22px] text-neutral-900 leading-tight tracking-tight">{report.title}</h3>
                {vote && onVote && (
                  <VoteButtons score={vote.score} userVote={vote.userVote} onVote={onVote}/>
                )}
              </div>
            </div>
            <button onClick={onClose} aria-label="Cerrar"
              className="flex-shrink-0 w-9 h-9 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/>
              </svg>
            </button>
          </div>
          <div className="p-5 border-b border-neutral-200">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Descripción</div>
            <p className="text-[14px] leading-relaxed text-neutral-700">{report.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-neutral-200 border-b border-neutral-200">
            <MetaCell label="Reportado por" value={report.user_name} icon={<UserIcon className="w-3.5 h-3.5"/>}/>
            <MetaCell label="Hace" value={report.days_ago === 0 ? 'hoy' : `${report.days_ago} ${report.days_ago === 1 ? 'día' : 'días'}`} icon={<ClockIcon className="w-3.5 h-3.5"/>}/>
            <MetaCell label="Categoría" value={cat.label} icon={<span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cat.color }}></span>}/>
            <MetaCell label="Estado" value={statusLabel} icon={<span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: statusTone }}></span>}/>
            <MetaCell label="Dirección" value={report.address} icon={<MapPinIcon className="w-3.5 h-3.5"/>} span={2}/>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Ubicación exacta</div>
              <div className="text-[10px] font-mono text-neutral-400">{report.latitude.toFixed(4)}°S, {Math.abs(report.longitude).toFixed(4)}°O</div>
            </div>
            <div ref={mapRef} style={{ height: 200 }} className="w-full border border-neutral-200 bg-neutral-100"></div>
          </div>
          <div className="mt-auto p-5 pt-3 border-t border-neutral-200 flex items-center gap-2">
            <button className="flex-1 h-11 bg-[#7C3AED] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors flex items-center justify-center gap-2">
              <CheckIcon className="w-3.5 h-3.5"/>
              Confirmar reporte
            </button>
            <button className="h-11 px-4 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-colors">
              Compartir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
