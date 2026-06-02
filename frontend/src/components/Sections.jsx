// src/components/Sections.jsx
import { SectionEyemark, CameraIcon, MapPinIcon, CheckIcon, UserIcon } from './Icons';
import { Logo } from './Icons';

// ── HowItWorks ──────────────────────────────────────────────
function FeatureLine({ icon, children }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-neutral-200">
      <span className="w-7 h-7 flex-shrink-0 bg-neutral-900 text-white flex items-center justify-center">{icon}</span>
      <span className="text-[13px] font-medium text-neutral-700">{children}</span>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      n: '01', title: 'Detectás',
      blurb: 'Ves un bache, un foco apagado, basura acumulada. Algo que la ciudad debería resolver.',
      caption: 'cualquier zona de Córdoba',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 iv-detect" style={{ overflow: 'visible' }}>
          <style>{`
            @keyframes iv-detect-scan { to { transform: rotate(360deg); } }
            @keyframes iv-detect-pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50%      { transform: scale(1.6); opacity: 0.55; }
            }
            @keyframes iv-detect-sweep {
              0%   { stroke-dashoffset: 126; opacity: 0; }
              20%  { opacity: 0.8; }
              100% { stroke-dashoffset: 0; opacity: 0; }
            }
            .iv-detect .iv-detect-cross {
              transform-origin: 50% 50%;
              transform-box: fill-box;
              animation: iv-detect-scan 6s linear infinite;
            }
            .iv-detect .iv-detect-center {
              transform-origin: 50% 50%;
              transform-box: fill-box;
              animation: iv-detect-pulse 1.6s ease-in-out infinite;
            }
            .iv-detect .iv-detect-arc {
              stroke-dasharray: 126;
              animation: iv-detect-sweep 2.2s ease-out infinite;
              transform-origin: 50% 50%;
              transform-box: fill-box;
            }
          `}</style>
          <circle cx="32" cy="32" r="20" fill="none" stroke="#7C3AED" strokeWidth="2"/>
          <circle className="iv-detect-arc" cx="32" cy="32" r="20" fill="none" stroke="#7C3AED" strokeWidth="2" pathLength="126"/>
          <g className="iv-detect-cross">
            <line x1="32" y1="6"  x2="32" y2="14" stroke="#7C3AED" strokeWidth="2"/>
            <line x1="32" y1="50" x2="32" y2="58" stroke="#7C3AED" strokeWidth="2"/>
            <line x1="6"  y1="32" x2="14" y2="32" stroke="#7C3AED" strokeWidth="2"/>
            <line x1="50" y1="32" x2="58" y2="32" stroke="#7C3AED" strokeWidth="2"/>
          </g>
          <circle className="iv-detect-center" cx="32" cy="32" r="4" fill="#7C3AED"/>
        </svg>
      ),
    },
    {
      n: '02', title: 'Reportás',
      blurb: 'Marcás el punto en el mapa, elegís categoría, sumás foto y descripción. Menos de un minuto.',
      caption: 'categorías predefinidas',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 iv-pin" style={{ overflow: 'visible' }}>
          <style>{`
            @keyframes iv-pin-bob {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-5px); }
            }
            .iv-pin .iv-pin-body {
              animation: iv-pin-bob 1.8s ease-in-out infinite;
              transform-origin: 50% 100%;
              transform-box: fill-box;
            }
          `}</style>
          <line x1="14" y1="54" x2="50" y2="54" stroke="#7C3AED" strokeWidth="2"/>
          <line x1="18" y1="58" x2="46" y2="58" stroke="#7C3AED" strokeWidth="2"/>
          <g className="iv-pin-body">
            <path d="M44 22c0 9-12 22-12 22S20 31 20 22a12 12 0 0 1 24 0z" fill="none" stroke="#7C3AED" strokeWidth="2"/>
            <circle cx="32" cy="22" r="4" fill="#7C3AED"/>
          </g>
        </svg>
      ),
    },
    {
      n: '03', title: 'Aparece en el mapa',
      blurb: 'Otros vecinos ven el reporte al instante. Vos seguís su estado: pendiente o resuelto.',
      caption: 'visible para toda la ciudad',
      icon: (
        <svg viewBox="0 0 64 64" className="w-12 h-12 iv-map" style={{ overflow: 'visible' }}>
          <style>{`
            @keyframes iv-map-glow {
              0%, 100% { transform: scale(1);   opacity: 0.55; }
              50%      { transform: scale(2.6); opacity: 0; }
            }
            @keyframes iv-map-blink {
              0%, 100% { opacity: 1; }
              50%      { opacity: 0.45; }
            }
            .iv-map .iv-map-glow {
              transform-origin: 50% 50%;
              transform-box: fill-box;
              animation: iv-map-glow 2.2s ease-out infinite;
            }
            .iv-map .iv-map-dot {
              transform-origin: 50% 50%;
              transform-box: fill-box;
              animation: iv-map-blink 2.2s ease-in-out infinite;
            }
          `}</style>
          <rect x="8" y="14" width="48" height="36" fill="none" stroke="#7C3AED" strokeWidth="2"/>
          <line x1="8"  y1="26" x2="56" y2="26" stroke="#7C3AED" strokeWidth="2"/>
          <line x1="22" y1="14" x2="22" y2="50" stroke="#7C3AED" strokeWidth="2"/>
          <circle className="iv-map-glow" cx="38" cy="38" r="3" fill="#7C3AED" style={{ animationDelay: '0s' }}/>
          <circle className="iv-map-dot"  cx="38" cy="38" r="3" fill="#7C3AED" style={{ animationDelay: '0s' }}/>
          <circle className="iv-map-glow" cx="46" cy="32" r="3" fill="#EF4444" style={{ animationDelay: '0.7s' }}/>
          <circle className="iv-map-dot"  cx="46" cy="32" r="3" fill="#EF4444" style={{ animationDelay: '0.7s' }}/>
          <circle className="iv-map-glow" cx="30" cy="42" r="3" fill="#F97316" style={{ animationDelay: '1.4s' }}/>
          <circle className="iv-map-dot"  cx="30" cy="42" r="3" fill="#F97316" style={{ animationDelay: '1.4s' }}/>
        </svg>
      ),
    },
  ];

  return (
    <section id="como" className="bg-white border-b border-neutral-200">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-20">
        <div className="grid grid-cols-12 gap-8 mb-14">
          <div className="col-span-12 lg:col-span-7">
            <SectionEyemark>04 · Cómo funciona</SectionEyemark>
            <h2 className="font-heading font-bold text-[36px] lg:text-[56px] tracking-[-0.02em] text-neutral-900 leading-[0.98] mt-2">
              Tres pasos.<br/>Sin formularios largos.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:pt-4">
            <p className="text-[15px] leading-relaxed text-neutral-600 max-w-md">
              Pensado para hacerlo desde el celular, parado en la esquina del problema. Solo necesitás una cuenta gratis con email.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
          {steps.map((s, i) => (
            <div key={s.n} className="bg-white p-8 lg:p-10 relative">
              <div className="flex items-start justify-between mb-10">
                <div className="font-mono text-[11px] tracking-widest text-neutral-400">PASO {s.n}</div>
                {s.icon}
              </div>
              <h3 className="font-heading font-bold text-[28px] tracking-tight text-neutral-900 leading-tight">{s.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-600 max-w-[32ch]">{s.blurb}</p>
              <div className="mt-8 text-[10px] font-mono uppercase tracking-widest text-neutral-400">· {s.caption}</div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 z-10 w-6 h-6 bg-white border border-neutral-200 items-center justify-center -translate-y-1/2">
                  <span className="text-neutral-400 text-xs">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <FeatureLine icon={<CameraIcon className="w-4 h-4"/>}>Hasta 5 fotos por reporte</FeatureLine>
          <FeatureLine icon={<MapPinIcon className="w-4 h-4"/>}>Geolocalización automática</FeatureLine>
          <FeatureLine icon={<CheckIcon className="w-4 h-4"/>}>Estado en tiempo real</FeatureLine>
          <FeatureLine icon={<UserIcon className="w-4 h-4"/>}>Tu nombre, tus reportes</FeatureLine>
        </div>
      </div>
    </section>
  );
}

// ── ActivityBar ──────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `hace ${days} d`;
  return `hace ${Math.floor(days / 7)} sem`;
}

export function ActivityBar({ reports = [], categoryColors = {} }) {
  const fallback = [
    { txt: 'Bache reparado en Av. Colón al 200', who: 'hace 14 h', cat: '#EF4444' },
    { txt: 'Nueva luminaria en Bv. San Juan',    who: 'hace 1 d',  cat: '#8B5CF6' },
    { txt: 'Contenedor reubicado en Güemes',     who: 'hace 2 d',  cat: '#F97316' },
    { txt: 'Semáforo restablecido en Bv. Illia', who: 'hace 3 d',  cat: '#64748B' },
  ];

  const base = reports.length > 0
    ? reports.slice(0, 20).map(r => ({
        txt: r.title,
        who: timeAgo(r.updated_at || r.created_at),
        cat: categoryColors[r.category] || '#64748B',
      }))
    : fallback;

  const minItems = 6;
  const repeated = base.length < minItems
    ? Array.from({ length: Math.ceil(minItems / base.length) }).flatMap(() => base)
    : base;
  const stream = [...repeated, ...repeated, ...repeated];

  return (
    <section className="bg-neutral-900 text-white py-5 border-b border-neutral-200 overflow-hidden">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 flex items-center gap-6">
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Resueltos · esta semana</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'iv-marquee 40s linear infinite' }}>
            {stream.map((it, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: it.cat }}></span>
                <CheckIcon className="w-3.5 h-3.5 text-[#10B981]"/>
                <span className="font-medium">{it.txt}</span>
                <span className="text-white/40 font-mono text-[11px]">· {it.who}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes iv-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </section>
  );
}

// ── ClosingCTA ──────────────────────────────────────────────
export function ClosingCTA() {
  return (
    <section id="sumate" className="bg-[#7C3AED] text-white relative overflow-hidden">
      <style>{`
        @keyframes iv-cta-grid-drift {
          0%   { background-position: 0px 0px, 0px 0px; }
          100% { background-position: 48px 48px, 48px 48px; }
        }
        @keyframes iv-cta-sweep {
          0%   { transform: translate(-60%, -50%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translate(60%, -50%); opacity: 0; }
        }
        @keyframes iv-cta-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50%      { transform: scale(2.4); opacity: 0; }
        }
        @keyframes iv-cta-dot {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 1; }
        }
        .iv-cta-grid {
          background-image:
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px);
          background-size: 48px 48px, 48px 48px;
          animation: iv-cta-grid-drift 8s linear infinite;
        }
        .iv-cta-sweep {
          position: absolute;
          width: 80%;
          aspect-ratio: 1 / 1;
          left: 10%;
          top: 50%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at center,
            rgba(255,255,255,0.14) 0%,
            rgba(255,255,255,0.10) 18%,
            rgba(255,255,255,0.05) 38%,
            rgba(255,255,255,0.02) 60%,
            rgba(255,255,255,0) 80%
          );
          filter: blur(40px);
          mix-blend-mode: screen;
          animation: iv-cta-sweep 14s ease-in-out infinite;
          pointer-events: none;
          will-change: transform, opacity;
        }
        .iv-cta-pin {
          position: absolute; width: 8px; height: 8px; border-radius: 9999px;
          background: white;
        }
        .iv-cta-pin::after {
          content: ""; position: absolute; inset: 0; border-radius: 9999px;
          background: white;
          animation: iv-cta-pulse 2.6s ease-out infinite;
        }
        .iv-cta-dot {
          position: absolute; width: 4px; height: 4px; border-radius: 9999px;
          background: white;
          animation: iv-cta-dot 3.4s ease-in-out infinite;
        }
      `}</style>

      <div className="iv-cta-grid absolute inset-0 pointer-events-none opacity-[0.14]" />
      <div className="iv-cta-sweep" />

      <div className="iv-cta-pin" style={{ top: '18%', left: '12%' }} />
      <div className="iv-cta-pin" style={{ top: '68%', left: '55%', animationDelay: '0.8s' }} />
      <div className="iv-cta-pin" style={{ top: '32%', left: '78%', animationDelay: '1.4s' }} />
      <div className="iv-cta-pin" style={{ top: '82%', left: '62%', animationDelay: '2.0s' }} />

      <div className="iv-cta-dot" style={{ top: '24%', left: '46%' }} />
      <div className="iv-cta-dot" style={{ top: '54%', left: '88%', animationDelay: '0.6s' }} />
      <div className="iv-cta-dot" style={{ top: '76%', left: '8%',  animationDelay: '1.2s' }} />
      <div className="iv-cta-dot" style={{ top: '14%', left: '64%', animationDelay: '1.8s' }} />

      <div className="relative max-w-[1320px] mx-auto px-6 lg:px-10 py-24">
        <div className="grid grid-cols-12 gap-8 items-end">
          <div className="col-span-12 lg:col-span-8">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/60 mb-4">05 · Sumate</div>
            <h2 className="font-heading font-bold text-[44px] sm:text-[64px] lg:text-[88px] tracking-[-0.025em] leading-[0.95]">
              La ciudad es nuestra.<br/>
              <span className="text-white/55">Cuidémosla entre todos.</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <p className="text-[15px] leading-relaxed text-white/80 max-w-md mb-6">
              Creá tu cuenta gratis y empezá a reportar. Solo necesitamos tu nombre, email y una contraseña.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="h-12 px-6 bg-white text-[#7C3AED] text-[12px] font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors inline-flex items-center gap-2">
                Registrarme <span>→</span>
              </button>
              <button className="h-12 px-6 border border-white/40 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                Ver el mapa
              </button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-[11px] font-mono text-white/60">
              <span>✓ Gratis para siempre</span>
              <span>✓ Sin app móvil</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────
function FooterCol({ title, links }) {
  return (
    <div className="col-span-6 md:col-span-2 lg:col-span-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l}><a href="#" className="text-[12.5px] text-neutral-400 hover:text-white transition-colors">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <Logo/>
              <span className="font-heading font-bold tracking-tight text-[22px] text-white">InfoCba</span>
            </div>
            <p className="mt-5 text-[13px] leading-relaxed max-w-sm">
              Plataforma ciudadana para reportar y consultar problemas urbanos en la Ciudad de Córdoba.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest border border-neutral-800 text-neutral-500">v0.2 · MVP</span>
              <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest border border-neutral-800 text-neutral-500">Grupo 8 · Seminario</span>
            </div>
          </div>
          <FooterCol title="Producto"   links={['Mapa', 'Categorías', 'Cómo funciona', 'Roadmap']}/>
          <FooterCol title="Comunidad"  links={['Blog vecinal', 'Estadísticas', 'Barrios cubiertos', 'API pública']}/>
          <FooterCol title="Legal"      links={['Privacidad', 'Términos', 'Ley 25.326', 'Contacto']}/>
        </div>
        <div className="mt-12 pt-6 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-4">
          <div className="text-[11px] font-mono text-neutral-500">© 2026 InfoCba · Córdoba, Argentina · Hecho con vecinos, para vecinos.</div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500">
            <span>Mapas: CARTO / IDECOR</span><span>·</span><span>31.4201°S, 64.1888°O</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
