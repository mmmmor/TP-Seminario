import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Calendar, User, Trash, Info } from '@phosphor-icons/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Logo, FilterIcon, CheckIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const categoryLabels = {
  baches:       'Baches',
  alumbrado:    'Alumbrado',
  residuos:     'Residuos',
  construccion: 'Construcción',
  extravios:    'Extravíos',
  otros:        'Otros',
};

const categoryColors = {
  baches:       '#EF4444',
  alumbrado:    '#8B5CF6',
  residuos:     '#88cc00',
  construccion: '#FACC15',
  extravios:    '#0EA5E9',
  otros:        '#6B7280',
};

const SORT_OPTIONS = [
  {
    id: 'relevantes',
    label: 'Relevantes',
    blurb: 'Pendientes primero, luego por fecha.',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9 12 2"/></svg>,
  },
  {
    id: 'recientes',
    label: 'Recientes',
    blurb: 'Últimos reportes cargados primero.',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    id: 'pendiente',
    label: 'Pendiente',
    blurb: 'Solo reportes pendientes de resolución.',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  {
    id: 'resuelto',
    label: 'Resuelto',
    blurb: 'Solo reportes marcados como resueltos.',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  },
];

const CATEGORIES = ['todos', 'baches', 'alumbrado', 'residuos', 'construccion', 'extravios', 'otros'];

function SortMenu({ value, onChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1.5 z-30 w-64 bg-white border border-neutral-200 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-neutral-200 text-[9px] font-bold uppercase tracking-widest text-neutral-400">
        Ordenar por
      </div>
      {SORT_OPTIONS.map(({ id, label, blurb, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`w-full text-left flex items-start gap-3 px-3 py-2.5 transition-colors ${
            value === id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-900'
          }`}
        >
          <span className={`mt-0.5 flex-shrink-0 ${value === id ? 'text-white' : 'text-neutral-400'}`}>{icon}</span>
          <span className="min-w-0">
            <span className="block text-[12px] font-bold uppercase tracking-widest leading-tight">{label}</span>
            <span className={`block text-[11px] mt-0.5 ${value === id ? 'text-white/70' : 'text-neutral-500'}`}>{blurb}</span>
          </span>
          {value === id && <CheckIcon className="w-3.5 h-3.5 ml-auto mt-1 flex-shrink-0" />}
        </button>
      ))}
    </div>
  );
}

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#7C3AED;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function CategorySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-neutral-300 px-3 h-10 text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: categoryColors[value] || '#7C3AED' }} />
          <span className="text-[13px] text-neutral-900">{categoryLabels[value] || value}</span>
        </span>
        <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-1 z-[500] bg-white border border-neutral-200 shadow-[0_-8px_24px_-6px_rgba(0,0,0,0.22)]">
          <div className="px-3 py-2 border-b border-neutral-200 text-[9px] font-bold uppercase tracking-widest text-neutral-400">
            Categoría
          </div>
          {Object.entries(categoryLabels).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { onChange(id); setOpen(false); }}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors ${
                value === id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-900'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: categoryColors[id], boxShadow: value === id ? '0 0 0 2px rgba(255,255,255,0.35)' : 'none' }}
              />
              <span className="text-[12px] font-bold uppercase tracking-widest">{label}</span>
              {value === id && <CheckIcon className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  { id: 'pending',  label: 'Pendiente', color: '#F59E0B' },
  { id: 'resolved', label: 'Resuelto',  color: '#10B981' },
];

function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const current = STATUS_OPTIONS.find((o) => o.id === value) || STATUS_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-neutral-300 px-3 h-9 text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: current.color }} />
          <span className="text-[13px] text-neutral-900">{current.label}</span>
        </span>
        <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-1 z-[500] bg-white border border-neutral-200 shadow-[0_-8px_24px_-6px_rgba(0,0,0,0.22)]">
          <div className="px-3 py-2 border-b border-neutral-200 text-[9px] font-bold uppercase tracking-widest text-neutral-400">
            Estado
          </div>
          {STATUS_OPTIONS.map(({ id, label, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => { onChange(id); setOpen(false); }}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors ${
                value === id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-900'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: color, boxShadow: value === id ? '0 0 0 2px rgba(255,255,255,0.35)' : 'none' }}
              />
              <span className="text-[12px] font-bold uppercase tracking-widest">{label}</span>
              {value === id && <CheckIcon className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MapClickMarker({ position, onMove }) {
  useMapEvents({ click: (e) => onMove(e.latlng) });
  return (
    <Marker
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={{ dragend: (e) => onMove(e.target.getLatLng()) }}
    />
  );
}

function EditModal({ report, onClose, onSave }) {
  const existingPaths = report.image_paths?.length
    ? report.image_paths
    : report.image_path ? [report.image_path] : [];

  const [form, setForm]           = useState({ title: report.title, description: report.description, address: report.address, user_name: report.user_name, category: report.category, status: report.status, latitude: report.latitude, longitude: report.longitude });
  const [voteInput, setVoteInput] = useState(String(report.vote_score ?? 0));
  const [keepPaths, setKeepPaths] = useState(existingPaths);
  const [newImages, setNewImages] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving]       = useState(false);
  const [error,  setError]        = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg,    setShowSugg]    = useState(false);
  const [addrFocused, setAddrFocused] = useState(false);
  const [geoLoading,  setGeoLoading]  = useState(false);
  const fileInputRef = useRef(null);
  const addrRef      = useRef(null);

  // Cierra sugerencias al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (addrRef.current && !addrRef.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const shortAddress = (displayName) => displayName.split(', ').slice(0, 4).join(', ');

  // Reordena "Calle 123" → "123 Calle, Córdoba, Argentina" para Nominatim
  const buildSearchQuery = (addr) => {
    const m = addr.trim().match(/^(.+?)\s+(\d+[a-zA-Z]?)\s*$/);
    return m ? `${m[2]} ${m[1]}, Córdoba, Argentina` : `${addr}, Córdoba, Argentina`;
  };

  // Búsqueda Nominatim debounced — solo cuando el campo está enfocado
  useEffect(() => {
    if (!addrFocused || !form.address || form.address.length < 3) { setSuggestions([]); setShowSugg(false); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(buildSearchQuery(form.address))}&format=json&limit=5&countrycodes=ar`,
          { headers: { 'Accept-Language': 'es' } }
        );
        setSuggestions(data);
        setShowSugg(data.length > 0);
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [form.address, addrFocused]);

  const allImages = [
    ...keepPaths.map((p) => ({ src: `${BACKEND_URL}/api/files/${p}`, path: p, isExisting: true })),
    ...newImages.map((img) => ({ src: img.url, blob: img.blob, isExisting: false })),
  ];
  const totalImages = allImages.length;
  const safeIdx = totalImages > 0 ? Math.min(activeIdx, totalImages - 1) : 0;
  const canAdd = totalImages < 5;

  useEffect(() => {
    if (activeIdx >= totalImages && totalImages > 0) setActiveIdx(totalImages - 1);
  }, [totalImages]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const removeCurrentImage = () => {
    const img = allImages[safeIdx];
    if (!img) return;
    if (img.isExisting) {
      setKeepPaths((prev) => prev.filter((p) => p !== img.path));
    } else {
      setNewImages((prev) => prev.filter((n) => n.url !== img.src));
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latlng = { lat: coords.latitude, lng: coords.longitude };
        await handleMarkerMove(latlng);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleMarkerMove = async (latlng) => {
    setForm((f) => ({ ...f, latitude: latlng.lat, longitude: latlng.lng }));
    try {
      const { data } = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (data?.display_name) setForm((f) => ({ ...f, address: shortAddress(data.display_name) }));
    } catch {}
  };

  const handleFileChange = (e) => {
    const slots = 5 - totalImages;
    const added = Array.from(e.target.files).slice(0, slots).map((f) => ({ blob: f, url: URL.createObjectURL(f) }));
    setNewImages((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data: patched } = await axios.patch(
        `${API}/reports/${report.id}`,
        { ...form, image_paths: keepPaths, vote_score: parseInt(voteInput, 10) || 0 },
        { withCredentials: true }
      );
      if (newImages.length > 0) {
        const fd = new FormData();
        newImages.forEach((img, i) => fd.append('images', img.blob, `foto_${i + 1}.jpg`));
        const { data: final } = await axios.post(`${API}/reports/${report.id}/images`, fd, { withCredentials: true });
        onSave(final);
      } else {
        onSave(patched);
      }
    } catch {
      setError('Error al guardar los cambios.');
      setSaving(false);
    }
  };

  const catColor = categoryColors[form.category] || '#7C3AED';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
         style={{ background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(2px)' }}
         onClick={onClose}>
      <style>{`@keyframes iv-modal-in { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div className="relative bg-white border border-neutral-200 w-full max-w-[1300px] max-h-[92vh] overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]"
           style={{ animation: 'iv-modal-in 180ms ease-out' }}
           onClick={(e) => e.stopPropagation()}
           role="dialog" aria-modal="true">

        {/* LEFT — galería */}
        <div className="col-span-1 lg:col-span-7 bg-neutral-950 flex flex-col">
          <div className="relative flex-1 flex items-center justify-center min-h-[280px] lg:min-h-[420px] overflow-hidden">
            {totalImages === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                   style={{ backgroundImage: `repeating-linear-gradient(45deg,${catColor}22,${catColor}22 8px,${catColor}0d 8px,${catColor}0d 16px)` }}>
                <svg className="w-10 h-10 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-white/50 text-[11px] font-mono">Sin fotos adjuntas</span>
              </div>
            ) : (
              <img src={allImages[safeIdx].src} alt="" className="w-full h-full object-cover"/>
            )}

            {totalImages > 0 && (
              <button onClick={removeCurrentImage}
                className="absolute top-3 right-3 w-9 h-9 bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                title="Eliminar foto">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/>
                </svg>
              </button>
            )}
            {totalImages > 0 && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/55 text-white text-[10px] font-mono tracking-wider">
                {safeIdx + 1} / {totalImages}
              </div>
            )}
            {totalImages > 1 && (
              <>
                <button onClick={() => setActiveIdx((i) => (i - 1 + totalImages) % totalImages)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/55 text-white hover:bg-black/80 flex items-center justify-center transition-colors">‹</button>
                <button onClick={() => setActiveIdx((i) => (i + 1) % totalImages)}
                  className="absolute right-14 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/55 text-white hover:bg-black/80 flex items-center justify-center transition-colors">›</button>
              </>
            )}
          </div>

          {/* Tiras de miniaturas */}
          <div className="flex gap-1.5 p-2 border-t border-neutral-800 bg-neutral-900 min-h-[68px] items-center">
            {allImages.map((img, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`relative w-14 h-14 flex-shrink-0 overflow-hidden border-2 transition-all ${safeIdx === i ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={img.src} alt="" className="w-full h-full object-cover"/>
              </button>
            ))}
            {canAdd && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange}/>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 flex-shrink-0 border-2 border-dashed border-neutral-600 text-neutral-500 hover:border-white hover:text-white flex flex-col items-center justify-center gap-0.5 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span className="text-[8px] font-mono uppercase">Foto</span>
                </button>
              </>
            )}
            <span className="ml-auto text-[9px] font-mono text-neutral-500 self-center pr-1">{totalImages}/5</span>
          </div>
        </div>

        {/* RIGHT — formulario */}
        <div className="col-span-1 lg:col-span-5 flex flex-col bg-white max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 flex-shrink-0">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-0.5">
                Reporte #{report.id.slice(0, 8).toUpperCase()}
              </div>
              <h2 className="font-heading font-bold text-[18px] text-neutral-900 leading-tight">Editar incidente</h2>
            </div>
            <button onClick={onClose}
              className="flex-shrink-0 w-9 h-9 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="flex flex-col flex-1 p-5 gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-[12px]">{error}</div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Título</label>
                <div className="flex items-center gap-1 select-none">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mr-1">Votos</span>
                  <button type="button"
                    onClick={() => setVoteInput((v) => String((parseInt(v, 10) || 0) - 1))}
                    className="w-7 h-7 flex items-center justify-center border border-neutral-200 text-neutral-400 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors text-[13px] font-bold">
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={voteInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || raw === '-' || /^-?\d+$/.test(raw)) setVoteInput(raw);
                    }}
                    onBlur={() => {
                      const n = parseInt(voteInput, 10);
                      setVoteInput(isNaN(n) ? '0' : String(n));
                    }}
                    className="w-12 h-7 border border-neutral-200 text-center text-[13px] font-bold tabular-nums text-neutral-800 bg-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                  <button type="button"
                    onClick={() => setVoteInput((v) => String((parseInt(v, 10) || 0) + 1))}
                    className="w-7 h-7 flex items-center justify-center border border-neutral-200 text-neutral-400 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors text-[13px] font-bold">
                    +
                  </button>
                </div>
              </div>
              <input type="text" value={form.title} required
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-neutral-300 px-3 h-10 text-[13px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Descripción</label>
              <textarea value={form.description} required rows={3}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-neutral-300 px-3 py-2 text-[13px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent resize-none"/>
            </div>
            <div className="relative" ref={addrRef}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Dirección</label>
              <input
                type="text"
                value={form.address}
                required
                autoComplete="off"
                onFocus={() => { setAddrFocused(true); if (suggestions.length > 0) setShowSugg(true); }}
                onBlur={() => setAddrFocused(false)}
                onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setShowSugg(true); }}
                className="w-full border border-neutral-300 px-3 h-10 text-[13px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              />
              {showSugg && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-neutral-200 shadow-lg max-h-[180px] overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setForm((f) => ({ ...f, address: shortAddress(s.display_name), latitude: parseFloat(s.lat), longitude: parseFloat(s.lon) }));
                        setSuggestions([]);
                        setShowSugg(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-[12px] text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 leading-snug">
                      {shortAddress(s.display_name)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Autor</label>
              <input type="text" value={form.user_name} required
                onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))}
                className="w-full border border-neutral-300 px-3 h-10 text-[13px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Categoría</label>
                <CategorySelect
                  value={form.category}
                  onChange={(cat) => setForm((f) => ({ ...f, category: cat }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Estado</label>
                <StatusSelect
                  value={form.status}
                  onChange={(s) => setForm((f) => ({ ...f, status: s }))}
                />
              </div>
            </div>

            {/* Mapa de ubicación */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500">Ubicación en el mapa</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {form.latitude?.toFixed(4)}°S · {Math.abs(form.longitude ?? 0).toFixed(4)}°O
                  </span>
                  <button type="button" onClick={handleGeolocate} disabled={geoLoading}
                    title="Usar mi ubicación actual"
                    className="w-7 h-7 flex items-center justify-center border border-neutral-300 text-neutral-500 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors disabled:opacity-40">
                    {geoLoading ? (
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" strokeDasharray="2 4"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div style={{ height: 220 }} className="border border-neutral-300 overflow-hidden">
                {form.latitude != null && form.longitude != null && (
                  <MapContainer
                    key={`${report.id}`}
                    center={[form.latitude, form.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    attributionControl={false}
                    scrollWheelZoom={true}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
                    <MapClickMarker
                      position={[form.latitude, form.longitude]}
                      onMove={handleMarkerMove}
                    />
                  </MapContainer>
                )}
              </div>
              <p className="mt-1 text-[10px] font-mono text-neutral-400">Hacé click o arrastrá el pin · la dirección se actualiza automáticamente</p>
            </div>

            <div className="mt-auto pt-3 border-t border-neutral-200 flex gap-3">
              <button type="submit" disabled={saving}
                className="flex-1 h-11 bg-[#7C3AED] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={onClose}
                className="h-11 px-5 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ report, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
         style={{ background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(2px)' }}
         onClick={onCancel}>
      <div className="bg-white border border-red-200 w-full max-w-[420px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]"
           style={{ animation: 'iv-modal-in 180ms ease-out' }}
           onClick={(e) => e.stopPropagation()}>

        {/* Header rojo */}
        <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Trash size={18} weight="bold" className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-200 mb-0.5">Acción irreversible</p>
            <p className="text-white font-bold text-[15px] leading-tight">Eliminar incidente</p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5">
          <p className="text-[13px] text-neutral-600 leading-relaxed">
            ¿Estás seguro de que querés eliminar{' '}
            <span className="font-bold text-neutral-900">"{report.title}"</span>?
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 h-10 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Sí, eliminar
          </button>
          <button
            onClick={onCancel}
            className="h-10 px-5 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sort, setSort]           = useState('relevantes');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [category, setCategory]   = useState('todos');
  const [editReport, setEditReport] = useState(null);
  const [deleteReport, setDeleteReport] = useState(null);
  const { logout } = useAuth();

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const { data } = await axios.get(`${API}/reports`, { withCredentials: true });
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await axios.put(`${API}/reports/${reportId}/status`, { status: newStatus }, { withCredentials: true });
      setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveEdit = (updated) => {
    setReports((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
    setEditReport(null);
  };

  const handleDelete = (report) => {
    setDeleteReport(report);
  };

  const confirmDelete = async () => {
    if (!deleteReport) return;
    try {
      await axios.delete(`${API}/reports/${deleteReport.id}`, { withCredentials: true });
      setReports(reports.filter(r => r.id !== deleteReport.id));
    } catch (err) {
      console.error('Error deleting report:', err);
    } finally {
      setDeleteReport(null);
    }
  };

  const imageSrc = (report) =>
    report.image_path
      ? `${BACKEND_URL}/api/files/${report.image_path}`
      : 'https://images.unsplash.com/photo-1580319978358-045c4fdccd16?w=400';

  const visibleReports = reports
    .filter(r => {
      if (category !== 'todos' && r.category !== category) return false;
      if (sort === 'pendiente') return r.status === 'pending';
      if (sort === 'resuelto')  return r.status === 'resolved';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'relevantes') {
        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const currentSortLabel = SORT_OPTIONS.find(o => o.id === sort)?.label ?? 'Relevantes';

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">

      <style>{`
        @keyframes iv-auth-grid-drift {
          0%   { background-position: 0px 0px, 0px 0px; }
          100% { background-position: 64px 64px, 64px 64px; }
        }
        .iv-auth-grid {
          background-image: linear-gradient(to right, #e5e5e5 1px, transparent 1px),
                            linear-gradient(to bottom, #e5e5e5 1px, transparent 1px);
          background-size: 64px 64px;
          animation: iv-auth-grid-drift 8s linear infinite;
        }
      `}</style>

      {/* Grilla de fondo animada */}
      <div className="iv-auth-grid fixed inset-0 pointer-events-none opacity-[0.45]" />

      {/* Header */}
      <header className="relative z-10 bg-white border-b border-neutral-200 sticky top-0">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <Logo />
            <span className="font-heading font-bold tracking-tight text-[22px] text-neutral-900">InfoCba</span>
            <span className="hidden md:inline-block ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200">
              Admin
            </span>
          </Link>
          <button
            onClick={logout}
            className="h-9 px-4 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="relative z-10 flex-1 max-w-[1320px] mx-auto w-full px-6 lg:px-10 py-14">

        {/* Eyemark + título */}
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400 mb-5">
          Panel · InfoCba
        </div>
        <h1 className="font-heading font-bold text-[52px] tracking-[-0.03em] text-neutral-900 leading-[0.92] mb-10">
          Control<br />central.
        </h1>

        {/* Controles: sort dropdown + filtro categoría */}
        <div className="flex flex-wrap items-center gap-3 mb-8">

          {/* Dropdown de ordenamiento */}
          <div className="relative">
            <button
              onClick={() => setSortMenuOpen(o => !o)}
              className={`flex items-center gap-1.5 h-10 px-4 border border-neutral-300 bg-white text-[11px] font-bold uppercase tracking-widest transition-colors ${
                sortMenuOpen ? 'text-neutral-900 border-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
              {currentSortLabel}
              <svg
                className={`w-3 h-3 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sortMenuOpen && (
              <SortMenu
                value={sort}
                onChange={(v) => { setSort(v); setSortMenuOpen(false); }}
                onClose={() => setSortMenuOpen(false)}
              />
            )}
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-neutral-300" />

          {/* Filtros de categoría */}
          <div className="flex items-center gap-px bg-neutral-300 border border-neutral-300">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`h-10 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  category === cat
                    ? 'bg-primary text-white'
                    : 'bg-white text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {cat === 'todos' ? 'Todos' : categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    {['Imagen', 'Incidencia', 'Categoría', 'Usuario / Fecha', 'Votos', 'Reporte confirmado', 'Estado', 'Acción'].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {visibleReports.map((report) => (
                    <tr key={report.id} className="hover:bg-neutral-50/60 transition-colors">

                      <td className="px-6 py-4">
                        <img src={imageSrc(report)} alt="" className="w-16 h-16 object-cover border border-neutral-100" />
                      </td>

                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-bold text-neutral-900 leading-tight mb-1">{report.title}</p>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                            <MapPin size={12} weight="bold" style={{ color: '#7C3AED' }} />
                            <span className="line-clamp-1">{report.address}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className="h-9 px-3 inline-flex items-center text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            color: categoryColors[report.category] ?? '#7C3AED',
                            background: (categoryColors[report.category] ?? '#7C3AED') + '18',
                          }}
                        >
                          {categoryLabels[report.category] ?? report.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs text-neutral-600 space-y-1">
                          <div className="flex items-center gap-1 font-bold">
                            <User size={13} weight="bold" />
                            <span>{report.user_name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-neutral-400 font-medium">
                            <Calendar size={13} weight="bold" />
                            <span>{format(new Date(report.created_at), 'dd/MM/yy HH:mm', { locale: es })}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold tabular-nums text-neutral-700">
                          {report.vote_score ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-[#7C3AED]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span className="text-[13px] font-bold tabular-nums text-neutral-700">
                            {report.confirmation_count ?? 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-36">
                          <StatusSelect
                            value={report.status}
                            onChange={(s) => handleStatusChange(report.id, s)}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditReport(report)}
                            className="h-9 px-3 border border-neutral-300 text-[10px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Info size={13} weight="bold" />
                            Detalles
                          </button>
                          <button
                            onClick={() => handleDelete(report)}
                            className="w-9 h-9 flex items-center justify-center border border-neutral-200 text-neutral-300 hover:text-red-500 hover:border-red-200 transition-colors"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visibleReports.length === 0 && (
                <div className="text-center py-20 text-neutral-400">
                  <p className="text-[11px] font-bold uppercase tracking-widest">
                    No hay reportes para este filtro.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {editReport && (
        <EditModal
          report={editReport}
          onClose={() => setEditReport(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteReport && (
        <DeleteConfirmModal
          report={deleteReport}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteReport(null)}
        />
      )}
    </div>
  );
}
