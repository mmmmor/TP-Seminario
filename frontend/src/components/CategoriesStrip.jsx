// src/components/CategoriesStrip.jsx
import { SectionEyemark } from './Icons';

const TILES = [
  { id: 'baches',       color: '#EF4444', name: 'Baches',       blurb: 'Roturas en el asfalto, pozos, hundimientos.' },
  { id: 'alumbrado',    color: '#8B5CF6', name: 'Alumbrado',    blurb: 'Luminarias apagadas, titilando o caídas.' },
  { id: 'residuos',     color: '#F97316', name: 'Residuos',     blurb: 'Contenedores desbordados, microbasurales.' },
  { id: 'construccion', color: '#FACC15', name: 'Construcción', blurb: 'Obras en curso, cortes parciales o desvíos en la zona.' },
  { id: 'extravios',    color: '#0EA5E9', name: 'Extravíos',    blurb: 'Objetos, mascotas o documentos perdidos.' },
  { id: 'otros',        color: '#6B7280', name: 'Otros',        blurb: 'Cualquier situación que no encaje en las categorías anteriores.' },
];

function CategoryTile({ color, name, count, blurb }) {
  return (
    <div className="bg-white p-6 hover:bg-neutral-50 transition-colors group cursor-pointer">
      <div className="flex items-start justify-between mb-8">
        <div className="w-10 h-10 flex items-center justify-center" style={{ background: color }}>
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <span className="font-heading text-[28px] font-bold tabular-nums text-neutral-900 leading-none">{count}</span>
      </div>
      <h3 className="font-heading font-bold text-[18px] text-neutral-900 tracking-tight">{name}</h3>
      <p className="mt-1.5 text-[13px] leading-snug text-neutral-500">{blurb}</p>
      <div className="mt-5 flex items-center text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
        Ver en el mapa
        <span className="ml-1.5 group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  );
}

export default function CategoriesStrip({ catCounts = {} }) {
  return (
    <section id="categorias" className="bg-white border-b border-neutral-200">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <SectionEyemark>02 · Categorías</SectionEyemark>
            <h2 className="font-heading font-bold text-[34px] lg:text-[44px] tracking-[-0.02em] text-neutral-900 leading-[1] mt-2">
              Seis formas de mejorar el barrio.
            </h2>
          </div>
          <div className="text-[11px] font-mono text-neutral-500 max-w-xs">
            Cada reporte se clasifica al cargarse. El color te ayuda a leer el mapa de un vistazo.
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-px bg-neutral-200 border border-neutral-200">
          {TILES.map(t => (
            <CategoryTile
              key={t.id}
              color={t.color}
              name={t.name}
              blurb={t.blurb}
              count={catCounts[t.id] ?? 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
