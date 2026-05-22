// src/components/Hero.jsx
import { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { PlusIcon, MapIcon, MapPinIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES } from '../data/landingData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 5)  return 'hace minutos';
  if (m < 60) return `hace ${m} min`;
  if (h < 24) return `hace ${h}h`;
  if (d === 1) return 'hace 1 día';
  return `hace ${d} días`;
}

function StatBlock({ value, label, tone, big }) {
  return (
    <div className="bg-white p-4">
      <div
        className={`font-heading font-bold tabular-nums text-neutral-900 leading-none ${big ? 'text-4xl' : 'text-3xl'}`}
        style={tone ? { color: tone } : {}}
      >
        {value}
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }}></span>
      {label}
    </span>
  );
}

function LivePreviewCard({ reports }) {
  const mapRef            = useRef(null);
  const mapInstanceRef    = useRef(null);
  const markersRef        = useRef({});
  const recentReportsRef  = useRef([]);
  const [mapReady, setMapReady]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Filter to last 12h; fall back to 4 most recent if fewer than 2 match
  const recentReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    const cutoff = Date.now() - 12 * 60 * 60 * 1000;
    const last12h = reports.filter((r) => new Date(r.created_at).getTime() > cutoff);
    const pool = last12h.length >= 2 ? last12h : [...reports];
    return pool
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);
  }, [reports]);
  recentReportsRef.current = recentReports;

  // Auto-cycle
  useEffect(() => {
    if (recentReports.length < 2) return;
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % recentReports.length), 4500);
    return () => clearInterval(id);
  }, [recentReports.length]);

  // Reset index when pool changes
  useEffect(() => { setActiveIdx(0); }, [recentReports.length]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !recentReports.length) return;

    const first = recentReports[0];
    const map = L.map(mapRef.current, {
      center: [first.latitude, first.longitude],
      zoom: 15, zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false, touchZoom: false, fadeAnimation: false,
    });

    const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png');
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      requestAnimationFrame(() => requestAnimationFrame(() => setMapReady(true)));
    };
    tiles.on('load', reveal);
    const fallback = setTimeout(reveal, 1500);
    tiles.addTo(map);

    recentReports.forEach((r, idx) => {
      const cat = CATEGORIES.find((c) => c.id === r.category) || { color: '#7C3AED' };
      const isFirst = idx === 0;
      const icon = L.divIcon({
        className: 'iv-live-marker',
        html: isFirst
          ? `<div class="iv-live-pin"><span class="iv-live-pulse" style="background:${cat.color}"></span><span class="iv-live-dot" style="background:${cat.color}"></span></div>`
          : `<div class="iv-live-mini" style="background:${cat.color}"></div>`,
        iconSize:  isFirst ? [60, 60] : [10, 10],
        iconAnchor: isFirst ? [30, 30] : [5, 5],
      });
      markersRef.current[r.id] = {
        marker: L.marker([r.latitude, r.longitude], { icon, interactive: false }).addTo(map),
        color: cat.color,
      };
    });

    mapInstanceRef.current = map;
    return () => {
      clearTimeout(fallback);
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
      setMapReady(false);
    };
  }, [recentReports]);

  // Update markers + fly — only when activeIdx actually changes (not on mapReady)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const reports = recentReportsRef.current;
    if (!map || !reports.length) return;
    const active = reports[activeIdx];
    if (!active) return;

    Object.entries(markersRef.current).forEach(([id, { marker, color }]) => {
      const isActive = id === active.id;
      const icon = L.divIcon({
        className: 'iv-live-marker',
        html: isActive
          ? `<div class="iv-live-pin"><span class="iv-live-pulse" style="background:${color}"></span><span class="iv-live-dot" style="background:${color}"></span></div>`
          : `<div class="iv-live-mini" style="background:${color}"></div>`,
        iconSize:  isActive ? [60, 60] : [10, 10],
        iconAnchor: isActive ? [30, 30] : [5, 5],
      });
      marker.setIcon(icon);
    });

    map.flyTo([active.latitude, active.longitude], 15, { duration: 1.2, easeLinearity: 0.25 });
  }, [activeIdx]);

  const active     = recentReports[activeIdx] || null;
  const activeCat  = active
    ? (CATEGORIES.find((c) => c.id === active.category) || { color: '#7C3AED', label: active.category })
    : null;
  const statusLabel = active?.status === 'resolved' ? 'Resuelto' : 'Pendiente';
  const statusColor = active?.status === 'resolved' ? '#10B981' : '#F59E0B';
  const timeLabel   = active ? relativeTime(active.created_at) : 'hace 12 min';
  const thumbnail   = active?.image_paths?.length
    ? `${BACKEND_URL}/api/files/${active.image_paths[0]}`
    : null;
  const shortAddress = active?.address
    ? active.address.split(',').slice(-1)[0].trim()
    : 'Centro';

  return (
    <div className="relative">

      {/* Header bar */}
      <div className="flex items-center justify-between border border-neutral-300 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-700">
            Mapa de Reportes · CBA
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">
          {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Map container */}
      <div className="relative border-l border-r border-neutral-300 bg-[#F4F4F2] h-[280px] overflow-hidden">

        {/* 3-D Leaflet map — always opacity:1, never animated */}
        <div className="iv-hero-map-perspective absolute inset-0">
          <div ref={mapRef} className="iv-hero-map-stage absolute" style={{ inset: '-15%' }} />
        </div>

        {/* Loading overlay — solid cover that fades OUT once map is ready */}
        <div
          className={`absolute inset-0 bg-[#F4F4F2] pointer-events-none z-[250]${mapReady ? ' iv-overlay-hidden' : ''}`}
        />

        {/* Depth vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-[300]"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.18), rgba(0,0,0,0) 35%),' +
              'radial-gradient(ellipse 90% 60% at 50% 90%, rgba(0,0,0,0.18), transparent 70%)',
          }}
        />

        {/* Compass */}
        <div className="absolute top-3 right-3 w-9 h-9 bg-white border border-neutral-300 flex items-center justify-center z-[400]">
          <span className="text-[9px] font-bold tracking-widest text-neutral-700">N</span>
          <span className="absolute top-1 left-1/2 -translate-x-1/2 w-px h-2 bg-[#7C3AED]"></span>
        </div>

        {/* Scale bar */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-[400] bg-white/80 backdrop-blur px-2 py-1">
          <div className="w-12 h-1 border-l border-r border-b border-neutral-500"></div>
          <span className="text-[9px] font-mono text-neutral-600">500 m</span>
        </div>
      </div>

      {/* Report card */}
      <div className="border border-neutral-300 bg-white">
        <div className="px-3 py-2 border-b border-neutral-200 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            {recentReports.length > 0 ? (
              <>Últimas 12 hs <span className="text-neutral-400 font-mono">· {activeIdx + 1}/{recentReports.length}</span></>
            ) : 'Último reporte'}
          </span>
          <span className="text-[10px] font-mono text-neutral-400">{timeLabel}</span>
        </div>

        <div key={active?.id || 'placeholder'} className="p-3 flex gap-3 iv-live-card-in">
          <div className="w-16 h-16 bg-neutral-100 flex-shrink-0 overflow-hidden border border-neutral-200">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e7e5e4, #e7e5e4 4px, #f5f5f4 4px, #f5f5f4 8px)' }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                style={{ background: activeCat?.color || '#EF4444' }}
              >
                {activeCat?.label || 'Baches'}
              </span>
              <span
                className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                style={{ background: statusColor }}
              >
                {statusLabel}
              </span>
            </div>
            <div className="text-[13px] font-semibold text-neutral-900 leading-tight line-clamp-1">
              {active?.title || 'Bache profundo en Av. Colón al 200'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <MapPinIcon className="w-3 h-3"/>
              {shortAddress} · {active?.user_name || 'Lucía P.'}
            </div>
          </div>
        </div>

        {recentReports.length > 1 && (
          <div className="px-3 pb-2 flex items-center gap-1.5">
            {recentReports.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-label={`Ver reporte ${i + 1}`}
                style={{
                  width: i === activeIdx ? 18 : 6,
                  height: 4,
                  background: i === activeIdx ? '#0a0a0a' : '#d4d4d4',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 200ms ease, background 200ms ease',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Category legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-neutral-500">
        {CATEGORIES.map((cat) => (
          <LegendDot key={cat.id} color={cat.color} label={cat.label} />
        ))}
      </div>
    </div>
  );
}

export default function Hero({ stats = {}, reports = [] }) {
  const {
    total    = 0,
    pending  = 0,
    resolved = 0,
    barrios  = 0,
    thisWeek = 0,
  } = stats;
  const { user } = useAuth();
  const navigate = useNavigate();

  const sectionRef = useRef(null);
  const sweepRef   = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sweep   = sweepRef.current;
    if (!section || !sweep) return;

    let rafId = null;
    let targetX = 0.5, targetY = 0.5;
    let currentX = 0.5, currentY = 0.5;
    let visible = false;

    const tick = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      sweep.style.left    = (currentX * 100) + '%';
      sweep.style.top     = (currentY * 100) + '%';
      sweep.style.opacity = visible ? '1' : '0';
      rafId = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const r = section.getBoundingClientRect();
      targetX = (e.clientX - r.left)  / r.width;
      targetY = (e.clientY - r.top)   / r.height;
      visible = true;
    };
    const onLeave = () => { visible = false; };

    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(tick);
    return () => {
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-neutral-50 border-b border-neutral-200 overflow-hidden">
      <style>{`
        @keyframes iv-hero-grid-drift {
          0%   { background-position: 0px 0px, 0px 0px; }
          100% { background-position: 64px 64px, 64px 64px; }
        }
        .iv-hero-grid {
          animation: iv-hero-grid-drift 8s linear infinite;
        }
        .iv-hero-sweep {
          position: absolute;
          width: 520px;
          height: 520px;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle at center,
            rgba(124,58,237,0.22) 0%,
            rgba(124,58,237,0.14) 22%,
            rgba(124,58,237,0.06) 45%,
            rgba(124,58,237,0.02) 68%,
            rgba(124,58,237,0) 84%
          );
          filter: blur(40px);
          opacity: 0;
          transition: opacity 400ms ease;
          pointer-events: none;
          will-change: left, top, opacity;
        }
      `}</style>
      <div ref={sweepRef} className="iv-hero-sweep" />
      <div className="iv-hero-grid absolute inset-0 pointer-events-none opacity-[0.45]"
        style={{
          backgroundImage: `linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black 40%, transparent 100%)',
        }}
      />
      <div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-16 lg:pb-20">
        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start">
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-2 mb-8">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-neutral-200 text-[10px] font-bold uppercase tracking-widest text-neutral-700">
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span>
                En vivo · Córdoba capital
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                {thisWeek} reportes esta semana
              </span>
            </div>
            <h1 className="font-heading font-bold tracking-[-0.03em] text-neutral-900 leading-[0.92] text-[60px] sm:text-[80px] lg:text-[112px]">
              Los problemas<br/>
              <span className="text-[#7C3AED]">de tu ciudad,</span><br/>
              <span className="relative inline-block">
                en un mapa.
                <svg className="absolute -bottom-3 left-0 w-full" height="14" viewBox="0 0 400 14" preserveAspectRatio="none">
                  <path d="M2 8 Q 100 2, 200 8 T 398 8" stroke="#7C3AED" strokeWidth="4" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p className="mt-10 max-w-xl text-[17px] leading-[1.55] text-neutral-600">
              InfoVía centraliza los problemas de la vía pública de Córdoba en un solo lugar.
              Reportalos en segundos, seguilos en el mapa, y enterate qué está pasando en tu barrio antes de salir.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(user ? '/nuevo-reporte' : '/registro')}
                className="h-12 px-6 bg-[#7C3AED] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors inline-flex items-center gap-2.5 group"
              >
                <PlusIcon className="w-4 h-4"/>
                Crear un reporte
                <span className="opacity-60 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <a href="#mapa" className="h-12 px-6 border border-neutral-900 text-neutral-900 text-[12px] font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors inline-flex items-center gap-2.5 no-underline">
                <MapIcon className="w-4 h-4"/>
                Explorar el mapa
              </a>
            </div>
            <dl className="mt-14 grid grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 max-w-[640px]">
              <StatBlock value={total}    label="Total reportes" big />
              <StatBlock value={pending}  label="Pendientes"     tone="#F59E0B" />
              <StatBlock value={resolved} label="Resueltos"      tone="#10B981" />
              <StatBlock value={barrios}  label="Barrios" />
            </dl>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:pl-4">
            <LivePreviewCard reports={reports} />
          </div>
        </div>
      </div>
    </section>
  );
}
