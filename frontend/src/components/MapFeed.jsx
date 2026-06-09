// src/components/MapFeed.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CATEGORIES } from '../data/landingData';
import { SectionEyemark, MapPinIcon, ClockIcon, FilterIcon, SearchIcon, CheckIcon, PlusIcon } from './Icons';
import ReportDetailModal from './ReportDetailModal';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

function daysAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.floor(diff / 86400000);
}

function toFeedReport(r) {
  const paths = r.image_paths?.length ? r.image_paths : (r.image_path ? [r.image_path] : []);
  return {
    ...r,
    image:  paths.length > 0 ? `${BACKEND_URL}/api/files/${paths[0]}` : null,
    images: paths.map((p) => `${BACKEND_URL}/api/files/${p}`),
    days_ago: daysAgo(r.created_at),
    score: r.vote_score ?? 0,
  };
}

function FeedTab({ active, onClick, children, tone }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors relative
        ${active ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'}`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: tone || '#7C3AED' }}></span>
      )}
    </button>
  );
}

function VoteColumn({ score, userVote, onVote }) {
  const stop = (e) => e.stopPropagation();
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 select-none" onClick={stop}>
      <button type="button"
        onClick={(e) => { e.stopPropagation(); onVote && onVote('up'); }}
        className={`w-6 h-6 flex items-center justify-center transition-colors
          ${userVote === 'up' ? 'text-white bg-[#F97316]' : 'text-neutral-400 hover:text-[#F97316] hover:bg-neutral-100'}`}
        aria-label="Votar a favor" aria-pressed={userVote === 'up'}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 14 12 8 18 14"/>
        </svg>
      </button>
      <div className={`text-[11px] font-bold tabular-nums leading-none min-w-[28px] text-center
        ${userVote === 'up' ? 'text-[#F97316]' : userVote === 'down' ? 'text-[#6366F1]' : 'text-neutral-700'}`}>
        {fmt(score)}
      </div>
      <button type="button"
        onClick={(e) => { e.stopPropagation(); onVote && onVote('down'); }}
        className={`w-6 h-6 flex items-center justify-center transition-colors
          ${userVote === 'down' ? 'text-white bg-[#6366F1]' : 'text-neutral-400 hover:text-[#6366F1] hover:bg-neutral-100'}`}
        aria-label="Votar en contra" aria-pressed={userVote === 'down'}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 10 12 16 18 10"/>
        </svg>
      </button>
    </div>
  );
}

function AuthPopup({ onClose, message = 'Iniciá sesión o creá una cuenta gratis para votar los reportes.' }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40"></div>
      <div
        className="relative bg-white border border-neutral-200 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.28)] w-full max-w-[340px] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="mt-2 mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] mb-2">Acceso requerido</div>
          <h3 className="font-heading font-bold text-[22px] tracking-tight text-neutral-900 leading-tight">
            Solo para usuarios registrados.
          </h3>
          <p className="mt-2 text-[13px] text-neutral-500 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onClose(); navigate('/iniciar-sesion'); }}
            className="h-10 px-4 border border-neutral-900 text-neutral-900 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { onClose(); navigate('/registro'); }}
            className="h-10 px-4 bg-[#7C3AED] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors"
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
}

const CAT_OPTIONS = [
  { id: 'baches',       label: 'Baches',       color: '#EF4444' },
  { id: 'alumbrado',    label: 'Alumbrado',    color: '#8B5CF6' },
  { id: 'residuos',     label: 'Residuos',     color: '#F97316' },
  { id: 'construccion', label: 'Construcción', color: '#FACC15' },
  { id: 'extravios',    label: 'Extravíos',    color: '#0EA5E9' },
];

function SortMenu({ value, onChange, catValue, onCatChange, onClose }) {
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

  const Item = ({ id, label, blurb, icon }) => (
    <button type="button" onClick={() => onChange(id)}
      className={`w-full text-left flex items-start gap-3 px-3 py-2.5 transition-colors
        ${value === id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-900'}`}>
      <span className={`mt-0.5 flex-shrink-0 ${value === id ? 'text-white' : 'text-neutral-400'}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-bold uppercase tracking-widest leading-tight">{label}</span>
        <span className={`block text-[11px] mt-0.5 ${value === id ? 'text-white/70' : 'text-neutral-500'}`}>{blurb}</span>
      </span>
      {value === id && <CheckIcon className="w-3.5 h-3.5 ml-auto mt-1 flex-shrink-0"/>}
    </button>
  );

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1.5 z-30 w-64 bg-white border border-neutral-200 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)]"
         onClick={(e) => e.stopPropagation()}>
      <div className="px-3 py-2 border-b border-neutral-200 text-[9px] font-bold uppercase tracking-widest text-neutral-400">Ordenar por</div>
      <Item id="relevant" label="Relevantes" blurb="Más votados por la comunidad primero."
        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9 12 2"/></svg>}/>
      <Item id="recent" label="Recientes" blurb="Últimos reportes cargados primero."
        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
      <div className="px-3 py-2 border-t border-b border-neutral-200 text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Categoría</div>
      <button type="button" onClick={() => onCatChange('all')}
        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors
          ${catValue === 'all' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-900'}`}>
        <span className="w-3 h-3 rounded-full border-2 border-neutral-400 flex-shrink-0"></span>
        <span className="text-[12px] font-bold uppercase tracking-widest">Todas</span>
        {catValue === 'all' && <CheckIcon className="w-3.5 h-3.5 ml-auto flex-shrink-0"/>}
      </button>
      {CAT_OPTIONS.map((c) => (
        <button key={c.id} type="button" onClick={() => onCatChange(c.id)}
          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors
            ${catValue === c.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-900'}`}>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }}></span>
          <span className="text-[12px] font-bold uppercase tracking-widest">{c.label}</span>
          {catValue === c.id && <CheckIcon className="w-3.5 h-3.5 ml-auto flex-shrink-0"/>}
        </button>
      ))}
    </div>
  );
}

function ReportCardRow({ report, active, onClick, onOpenDetails, vote, onVote }) {
  const cat = CATEGORIES.find((c) => c.id === report.category) || CATEGORIES[3];
  const statusTone = report.status === 'pending' ? '#F59E0B' : '#10B981';
  const statusLabel = report.status === 'pending' ? 'Pendiente' : 'Resuelto';
  const score = (vote && vote.score) || 0;
  const userVote = vote && vote.userVote;

  return (
    <div role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={`group w-full text-left bg-white border transition-all flex gap-2 p-3 cursor-pointer
        ${active ? 'border-neutral-900 shadow-[0_0_0_3px_rgba(0,75,235,0.08)]' : 'border-neutral-200 hover:border-neutral-400'}`}>
      <VoteColumn score={score} userVote={userVote} onVote={onVote}/>
      <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-100 overflow-hidden border border-neutral-200">
        <img src={report.image} alt="" className="w-full h-full object-cover"
             onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement.style.backgroundImage =
                 `repeating-linear-gradient(45deg, ${cat.color}22, ${cat.color}22 4px, ${cat.color}11 4px, ${cat.color}11 8px)`;
             }}/>
        <span className="absolute top-1 left-1 w-2 h-2 rounded-full border border-white" style={{ background: cat.color }}></span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: cat.color }}>{cat.label}</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: statusTone }}>{statusLabel}</span>
        </div>
        <h4 className="text-[13.5px] font-semibold text-neutral-900 leading-snug line-clamp-1">{report.title}</h4>
        <p className="text-[12px] text-neutral-500 leading-snug line-clamp-1 mt-0.5">{report.description}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono min-w-0">
            <span className="inline-flex items-center gap-1 truncate min-w-0">
              <MapPinIcon className="w-3 h-3 text-neutral-400 flex-shrink-0"/>
              <span className="truncate">{report.address}</span>
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <ClockIcon className="w-3 h-3 text-neutral-400"/>
              {report.days_ago === 0 ? 'hoy' : `hace ${report.days_ago} ${report.days_ago === 1 ? 'día' : 'días'}`}
            </span>
          </div>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onOpenDetails && onOpenDetails(); }}
            className="flex-shrink-0 px-2 py-1 border border-neutral-300 text-[9px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors">
            Detalles
          </button>
        </div>
      </div>
    </div>
  );
}

function MicroStat({ label, value, delta, deltaTone, tone }) {
  return (
    <div className="bg-white p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</div>
      <div className="font-heading text-[28px] font-bold tabular-nums text-neutral-900 leading-none mt-3" style={tone ? { color: tone } : {}}>{value}</div>
      <div className="text-[11px] font-mono mt-1.5" style={{ color: deltaTone || '#737373' }}>{delta}</div>
    </div>
  );
}

export default function MapFeed() {
  const { user } = useAuth();
  const [reports, setReports]     = useState([]);
  const [filter, setFilter]       = useState('all');
  const [sort, setSort]           = useState('relevant');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [detailReport, setDetailReport] = useState(null);
  const [mapReady, setMapReady]   = useState(false);
  const [votes, setVotes]         = useState({});
  const [catFilter, setCatFilter] = useState('all');
  const [authPopup, setAuthPopup] = useState(false);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/reports`)
      .then(({ data }) => {
        const mapped = data.map(toFeedReport);
        setReports(mapped);
        if (mapped.length > 0) setActiveReport(mapped[0]);
        const init = {};
        mapped.forEach(r => { init[r.id] = { score: r.vote_score ?? 0, userVote: null }; });
        setVotes(init);
      })
      .catch(err => console.error('Error cargando reportes:', err));
  }, []);

  useEffect(() => {
    if (!user) return;
    axios.get(`${BACKEND_URL}/api/votes/mine`, { withCredentials: true })
      .then(({ data }) => {
        setVotes(v => {
          const updated = { ...v };
          Object.entries(data).forEach(([reportId, direction]) => {
            if (updated[reportId]) updated[reportId] = { ...updated[reportId], userVote: direction };
          });
          return updated;
        });
      })
      .catch(() => {});
  }, [user]);

  const handleVote = useCallback(async (reportId, dir) => {
    if (!user) { setAuthPopup(true); return; }
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/reports/${reportId}/vote`,
        { direction: dir },
        { withCredentials: true }
      );
      setVotes(v => ({ ...v, [reportId]: { score: data.score, userVote: data.user_vote } }));
    } catch (err) {
      console.error('Error al votar:', err);
    }
  }, [user]);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && window.L) {
      const map = window.L.map(mapRef.current, {
        center: [-31.4201, -64.1888], zoom: 13, zoomControl: false, attributionControl: false,
      });
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
      setMapReady(true);
    }
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const visible = reports.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (catFilter !== 'all' && r.category !== catFilter) return false;
      return true;
    });
    visible.forEach((r) => {
      const cat = CATEGORIES.find((c) => c.id === r.category) || { color: '#7C3AED' };
      const isActive = activeReport && activeReport.id === r.id;
      const icon = window.L.divIcon({
        className: 'custom-marker-icon',
        html: `<div style="background:${cat.color};width:${isActive ? 28 : 20}px;height:${isActive ? 28 : 20}px;border-radius:50%;border:${isActive ? 4 : 3}px solid white;box-shadow:0 2px ${isActive ? 12 : 6}px rgba(0,0,0,0.35);${isActive ? 'outline:2px solid ' + cat.color + ';outline-offset:2px;' : ''}"></div>`,
        iconSize: [isActive ? 28 : 20, isActive ? 28 : 20],
        iconAnchor: [isActive ? 14 : 10, isActive ? 14 : 10],
      });
      const marker = window.L.marker([r.latitude, r.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .on('click', () => {
          setActiveReport(r);
          if (mapInstanceRef.current) mapInstanceRef.current.flyTo([r.latitude, r.longitude], 16, { duration: 0.7 });
        });
      markersRef.current.push(marker);
    });
  }, [filter, sort, catFilter, mapReady, activeReport, reports]);

  const CAT_LABELS = { baches: 'Baches', alumbrado: 'Alumbrado', residuos: 'Residuos', construccion: 'Construcción', extravios: 'Extravíos' };
  const CAT_COLORS = { baches: '#EF4444', alumbrado: '#8B5CF6', residuos: '#F97316', construccion: '#FACC15', extravios: '#0EA5E9' };

  const microStats = (() => {
    const weekAgo  = Date.now() - 7 * 86400000;
    const thisWeek = reports.filter(r => new Date(r.created_at).getTime() >= weekAgo).length;

    const catMap = {};
    const barrioMap = {};
    reports.forEach(r => {
      if (r.category) catMap[r.category] = (catMap[r.category] || 0) + 1;
      const p = r.address?.split(',').map(s => s.trim());
      if (p?.length >= 2) barrioMap[p[1]] = (barrioMap[p[1]] || 0) + 1;
    });

    const topCatEntry  = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const topCat       = topCatEntry ? topCatEntry[0] : null;
    const topCatPct    = topCatEntry && reports.length > 0 ? Math.round(topCatEntry[1] / reports.length * 100) : 0;
    const topBarrio    = Object.entries(barrioMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    return { thisWeek, topCat, topCatPct, topBarrio };
  })();

  const filtered = reports
    .filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (catFilter !== 'all' && r.category !== catFilter) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (sort === 'recent') return a.days_ago - b.days_ago;
      return ((votes[b.id] && votes[b.id].score) || 0) - ((votes[a.id] && votes[a.id].score) || 0);
    });

  return (
    <section id="mapa" className="bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-14">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <SectionEyemark>03 · Mapa de reportes</SectionEyemark>
            <h2 className="font-heading font-bold text-[34px] lg:text-[44px] tracking-[-0.02em] text-neutral-900 leading-[1] mt-2 max-w-[16ch]">
              Todo lo que pasa, en una sola vista.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 h-10 px-3 border border-neutral-300 bg-white min-w-[260px]">
              <SearchIcon className="w-4 h-4 text-neutral-400"/>
              <input type="text" placeholder="Buscar por dirección o barrio"
                className="flex-1 bg-transparent border-0 outline-none text-[12px] placeholder:text-neutral-400 text-neutral-900"/>
            </div>
            <button onClick={() => user ? navigate('/nuevo-reporte') : setAuthPopup('reporte')} className="h-10 px-4 bg-[#7C3AED] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors inline-flex items-center gap-2">
              <PlusIcon className="w-3.5 h-3.5"/>
              Nuevo reporte
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-neutral-300 border border-neutral-300">
          <div className="col-span-1 lg:col-span-7 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-700">Vista en vivo</span>
                <span className="text-[11px] font-mono text-neutral-400 ml-2">{filtered.length} pines</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORIES.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }}></span>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
            <div ref={mapRef} style={{ height: 560 }} className="w-full bg-neutral-100"></div>
          </div>

          <div className="col-span-1 lg:col-span-5 bg-white flex flex-col" style={{ maxHeight: 596 }}>
            <div className="border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-heading font-bold text-[16px] text-neutral-900">Reportes</h3>
              <div className="relative">
                <button onClick={() => setSortMenuOpen((o) => !o)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors
                    ${sortMenuOpen ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}>
                  <FilterIcon className="w-3.5 h-3.5"/>
                  {sort === 'recent' ? 'Recientes' : 'Relevantes'}
                  <svg className={`w-3 h-3 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {sortMenuOpen && (
                  <SortMenu
                    value={sort} onChange={(v) => { setSort(v); setSortMenuOpen(false); }}
                    catValue={catFilter} onCatChange={(v) => { setCatFilter(v); setSortMenuOpen(false); }}
                    onClose={() => setSortMenuOpen(false)}
                  />
                )}
              </div>
            </div>
            <div className="flex border-b border-neutral-200">
              <FeedTab active={filter === 'all'}      onClick={() => setFilter('all')}>Todos ({reports.length})</FeedTab>
              <FeedTab active={filter === 'pending'}  onClick={() => setFilter('pending')} tone="#F59E0B">
                Pendientes ({reports.filter((r) => r.status === 'pending').length})
              </FeedTab>
              <FeedTab active={filter === 'resolved'} onClick={() => setFilter('resolved')} tone="#10B981">
                Resueltos ({reports.filter((r) => r.status === 'resolved').length})
              </FeedTab>
            </div>
            <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-3 space-y-2">
              {filtered.map((r) => (
                <ReportCardRow key={r.id} report={r}
                  active={activeReport && activeReport.id === r.id}
                  onClick={() => {
                    setActiveReport(r);
                    if (mapInstanceRef.current) mapInstanceRef.current.flyTo([r.latitude, r.longitude], 16, { duration: 0.7 });
                  }}
                  onOpenDetails={() => setDetailReport(r)}
                  vote={votes[r.id] || { score: 0, userVote: null }}
                  onVote={(dir) => handleVote(r.id, dir)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
          <MicroStat
            label="Reportes esta semana"
            value={microStats.thisWeek}
            delta={`de ${reports.length} totales`}
          />
          <MicroStat
            label="Barrio con más reportes"
            value={microStats.topBarrio}
            delta={`${reports.filter(r => r.status === 'pending').length} pendientes`}
          />
          <MicroStat
            label="Categoría más reportada"
            value={microStats.topCat ? (CAT_LABELS[microStats.topCat] ?? microStats.topCat) : '—'}
            delta={`${microStats.topCatPct}% del total`}
            tone={microStats.topCat ? CAT_COLORS[microStats.topCat] : undefined}
          />
        </div>
      </div>

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          vote={votes[detailReport.id] || { score: 0, userVote: null }}
          onVote={(dir) => handleVote(detailReport.id, dir)}
        />
      )}
      {authPopup && <AuthPopup onClose={() => setAuthPopup(false)} message={authPopup === 'reporte' ? 'Iniciá sesión o creá una cuenta gratis para agregar nuevos reportes.' : 'Iniciá sesión o creá una cuenta gratis para votar los reportes.'}/>}
    </section>
  );
}
