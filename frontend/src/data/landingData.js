// src/data/landingData.js

export const SAMPLE_REPORTS = [
  {
    id: 'r1',
    title: 'Bache profundo en Av. Colón',
    description: 'Un bache de aprox 60 cm en el carril rápido. Genera frenadas bruscas y riesgo para motos.',
    category: 'baches',
    status: 'pending',
    address: 'Av. Colón 220, Centro',
    user_name: 'Lucía P.',
    latitude: -31.4135,
    longitude: -64.1881,
    days_ago: 2,
    score: 24,
    image: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=600&q=80',
  },
  {
    id: 'r2',
    title: 'Luminaria apagada hace 3 noches',
    description: 'La esquina queda completamente a oscuras. Es zona de paso peatonal hacia la facultad.',
    category: 'alumbrado',
    status: 'pending',
    address: 'Bv. San Juan 540, Nueva Córdoba',
    user_name: 'Mateo R.',
    latitude: -31.4250,
    longitude: -64.1900,
    days_ago: 1,
    score: 47,
    image: 'https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=600&q=80',
  },
  {
    id: 'r3',
    title: 'Contenedor desbordado',
    description: 'Acumulación de bolsas alrededor del contenedor desde el fin de semana.',
    category: 'residuos',
    status: 'resolved',
    address: 'Pje. Revol y Achával Rodríguez, Güemes',
    user_name: 'Tomás V.',
    latitude: -31.4290,
    longitude: -64.1840,
    days_ago: 5,
    score: 8,
    image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&q=80',
  },
  {
    id: 'r4',
    title: 'Obra sobre calzada, carril cerrado',
    description: 'Cuadrilla trabajando en repavimentación. Desvío al carril derecho.',
    category: 'construccion',
    status: 'pending',
    address: 'Av. Vélez Sarsfield y Bv. Illia',
    user_name: 'Camila S.',
    latitude: -31.4220,
    longitude: -64.1855,
    days_ago: 0,
    score: 62,
    image: 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=600&q=80',
  },
  {
    id: 'r5',
    title: 'Mochila perdida en parada del 600',
    description: 'Mochila negra con cuadernos universitarios. Última vez vista a las 18:30.',
    category: 'extravios',
    status: 'resolved',
    address: 'Belgrano 812, Alberdi',
    user_name: 'Florencia G.',
    latitude: -31.4170,
    longitude: -64.2000,
    days_ago: 8,
    score: 3,
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&q=80',
  },
  {
    id: 'r6',
    title: 'Bache encadenado, 3 metros',
    description: 'Pozos sucesivos sobre el carril derecho. Falta señalización.',
    category: 'baches',
    status: 'pending',
    address: 'Av. Rafael Núñez 4100, Cerro de las Rosas',
    user_name: 'Diego M.',
    latitude: -31.3850,
    longitude: -64.2150,
    days_ago: 3,
    score: 31,
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=80',
  },
  {
    id: 'r7',
    title: 'Microbasural en terreno baldío',
    description: 'Se acumulan escombros y residuos verdes hace semanas.',
    category: 'residuos',
    status: 'pending',
    address: 'Roque Sáenz Peña 1500, San Vicente',
    user_name: 'Vecinos San Vicente',
    latitude: -31.4280,
    longitude: -64.1650,
    days_ago: 12,
    score: 18,
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80',
  },
  {
    id: 'r8',
    title: 'Foco de luz titilando',
    description: 'Foco LED de la columna se prende y se apaga toda la noche.',
    category: 'alumbrado',
    status: 'resolved',
    address: 'Av. Hipólito Yrigoyen 380, Nueva Córdoba',
    user_name: 'Sebastián T.',
    latitude: -31.4255,
    longitude: -64.1875,
    days_ago: 9,
    score: -2,
    image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=600&q=80',
  },
];

export const CATEGORIES = [
  { id: 'baches',       label: 'Baches',       color: '#EF4444' },
  { id: 'alumbrado',    label: 'Alumbrado',    color: '#8B5CF6' },
  { id: 'residuos',     label: 'Residuos',     color: '#88cc00' },
  { id: 'construccion', label: 'Construcción', color: '#FACC15' },
  { id: 'extravios',    label: 'Extravíos',    color: '#0EA5E9' },
  { id: 'otros',        label: 'Otros',        color: '#6B7280' },
];

export const STATS = {
  total: 247,
  pending: 158,
  resolved: 89,
  this_week: 34,
  barrios: 23,
  resolved_pct: 36,
};

export const CATEGORY_BREAKDOWN = [
  { id: 'baches',       label: 'Baches',       count: 112, color: '#EF4444' },
  { id: 'alumbrado',    label: 'Alumbrado',    count:  58, color: '#8B5CF6' },
  { id: 'residuos',     label: 'Residuos',     count:  47, color: '#88cc00' },
  { id: 'construccion', label: 'Construcción', count:  30, color: '#FACC15' },
  { id: 'extravios',    label: 'Extravíos',    count:  18, color: '#0EA5E9' },
  { id: 'otros',        label: 'Otros',        count:   9, color: '#6B7280' },
];

export const CATEGORY_GALLERY = {
  baches: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&q=80',
    'https://images.unsplash.com/photo-1568667256549-094345857637?w=900&q=80',
  ],
  alumbrado: [
    'https://images.unsplash.com/photo-1519955266818-0231b63402b3?w=900&q=80',
    'https://images.unsplash.com/photo-1505740106531-4243f3831c78?w=900&q=80',
  ],
  residuos: [
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=900&q=80',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=900&q=80',
  ],
  construccion: [
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=80',
  ],
  extravios: [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80',
    'https://images.unsplash.com/photo-1551006917-3b4c2dba2c4e?w=900&q=80',
  ],
  otros: [
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=900&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80',
  ],
};

export function galleryFor(report) {
  const extras = CATEGORY_GALLERY[report.category] || [];
  return [report.image, ...extras].filter(Boolean);
}
