import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { MapPin, Camera, MagnifyingGlass, Trash, Check } from '@phosphor-icons/react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Header } from '../components/Header';
import { CATEGORIES } from '../data/landingData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const defaultIcon = L.divIcon({
  className: 'custom-marker-icon',
  html: `<div style="background-color:#7C3AED;width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function LocationMarker({ position, setPosition, setAddress }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then((r) => r.json())
        .then((d) => setAddress(d.display_name || `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`))
        .catch(() => setAddress(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`));
    },
  });
  useEffect(() => { if (position) map.flyTo(position, 16, { animate: true, duration: 1.5 }); }, [position, map]);
  return position ? <Marker position={position} icon={defaultIcon} /> : null;
}

const getCroppedImg = (image, crop, fileName) => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width  = crop.width;
  canvas.height = crop.height;
  canvas.getContext('2d').drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      blob.name = fileName;
      resolve(blob);
    }, 'image/jpeg');
  });
};

/* ── Componente de label de sección ── */
function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
      {children}
    </label>
  );
}

export default function NewReport() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState('');
  const [catOpen, setCatOpen]       = useState(false);
  const catRef                       = useRef(null);
  const [position, setPosition]     = useState(null);
  const [address, setAddress]       = useState('');

  const [images, setImages]               = useState([]); // [{blob, url}]
  const [editingSrc, setEditingSrc]       = useState(null);
  const [crop, setCrop]                   = useState({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imageRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!catOpen) return;
    const onDoc = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setCatOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [catOpen]);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setEditingSrc(reader.result));
      reader.readAsDataURL(e.target.files[0]);
      setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
      setCompletedCrop(null);
      e.target.value = '';
    }
  };

  const onImageLoad = (e) => { imageRef.current = e.currentTarget; };

  const confirmCrop = async () => {
    if (imageRef.current && completedCrop?.width && completedCrop?.height) {
      try {
        const blob = await getCroppedImg(imageRef.current, completedCrop, `foto_${images.length + 1}.jpg`);
        setImages((prev) => [...prev, { blob, url: URL.createObjectURL(blob) }]);
        setEditingSrc(null);
        setCompletedCrop(null);
      } catch (e) { console.error('Error recortando la imagen', e); }
    }
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoError('');
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setPosition(pos);
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
          const data = await res.json();
          setAddress(data.display_name || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
        } catch {
          setAddress(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
        }
        setIsGeolocating(false);
      },
      (err) => {
        const msgs = {
          1: 'Permiso de ubicación denegado. Habilitalo en la configuración del navegador.',
          2: 'No se pudo obtener la ubicación. Verificá tu conexión o GPS.',
          3: 'Se agotó el tiempo para obtener la ubicación. Intentá de nuevo.',
        };
        setGeoError(msgs[err.code] || 'Error al obtener la ubicación.');
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Córdoba, Argentina')}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const r = data[0];
        setPosition({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
        setAddress(r.display_name);
      }
    } catch (err) { console.error('Error buscando la dirección:', err); }
    finally { setIsSearching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!position)          { setSubmitError('Seleccioná una ubicación en el mapa o buscá una dirección.'); return; }
    if (!category)          { setSubmitError('Seleccioná una categoría para el reporte.'); return; }
    if (images.length === 0) { setSubmitError('Subí al menos una imagen del problema y confirmá el recorte.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('latitude', position.lat);
      formData.append('longitude', position.lng);
      formData.append('address', address);
      images.forEach((img, i) => formData.append('images', img.blob, `foto_${i + 1}.jpg`));
      await axios.post(`${API}/reports`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true });
      navigate('/');
    } catch (error) {
      setSubmitError(error.response?.data?.detail || 'Error al crear el reporte. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-neutral-50 flex flex-col">

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

      {/* Header del landing */}
      <div className="relative z-[100]">
        <Header />
      </div>

      {/* Contenido */}
      <main className="relative z-10 flex-1 min-h-0 max-w-[1320px] mx-auto w-full px-6 lg:px-10 py-4 flex flex-col">

        {/* Encabezado de página */}
        <div className="mb-4">
          <h1 className="font-heading font-bold text-[52px] tracking-[-0.03em] text-neutral-900 leading-[0.92]">
            Reportar<br />un problema.
          </h1>
        </div>

        {/* Grid de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-neutral-300 border border-neutral-300 flex-1 min-h-0">

          {/* ── COLUMNA IZQUIERDA: Formulario ── */}
          <div className="bg-white overflow-y-auto">

            {/* Error de envío */}
            {submitError && (
              <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-[12px] font-medium">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Título */}
              <div className="p-6 border-b border-neutral-200">
                <FieldLabel>Título del reporte</FieldLabel>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ej: Semáforo roto en Av. San Martín y Bv. San Juan"
                  className="w-full border border-neutral-300 px-3 h-11 text-[14px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-neutral-400"
                />
              </div>

              {/* Categoría */}
              <div className="p-6 border-b border-neutral-200">
                <FieldLabel>Categoría</FieldLabel>
                <div ref={catRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setCatOpen((o) => !o)}
                    className="w-full border border-neutral-300 px-3 h-11 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center gap-3 cursor-pointer"
                  >
                    {category ? (
                      <>
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CATEGORIES.find((c) => c.id === category)?.color }}></span>
                        <span className="text-[12px] font-bold uppercase tracking-widest text-neutral-900">
                          {CATEGORIES.find((c) => c.id === category)?.label}
                        </span>
                      </>
                    ) : (
                      <span className="text-neutral-400">Seleccioná una categoría</span>
                    )}
                    <svg className="w-4 h-4 text-neutral-400 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {catOpen && (
                    <div className="absolute left-0 top-full mt-1 z-30 w-full bg-white border border-neutral-200 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)]">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setCategory(c.id); setCatOpen(false); }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors
                            ${category === c.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-900'}`}
                        >
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }}></span>
                          <span className="text-[12px] font-bold uppercase tracking-widest">{c.label}</span>
                          {category === c.id && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0"/>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="p-6 border-b border-neutral-200">
                <FieldLabel>Descripción</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describí el problema con el mayor detalle posible..."
                  rows={4}
                  className="w-full border border-neutral-300 px-3 py-2.5 text-[14px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-neutral-400"
                />
              </div>

              {/* Imágenes */}
              <div className="p-6 border-b border-neutral-200">
                <FieldLabel>
                  Imágenes del problema
                  <span className="ml-2 font-mono text-neutral-400 normal-case tracking-normal">({images.length}/5)</span>
                </FieldLabel>

                {/* Crop interface */}
                {editingSrc && (
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="border border-neutral-200 bg-white p-2 flex justify-center overflow-hidden">
                      <ReactCrop
                        crop={crop}
                        onChange={(_, pct) => setCrop(pct)}
                        onComplete={(c) => setCompletedCrop(c)}
                      >
                        <img src={editingSrc} onLoad={onImageLoad} alt="Recorte" className="max-h-[280px] w-auto object-contain" />
                      </ReactCrop>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-mono text-neutral-500">Ajustá el recuadro para enfocar el problema.</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setEditingSrc(null); setCompletedCrop(null); }}
                          className="h-9 px-4 border border-neutral-300 text-neutral-700 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors">
                          Cancelar
                        </button>
                        <button type="button" onClick={confirmCrop}
                          className="h-9 px-4 bg-primary text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors inline-flex items-center gap-2">
                          <Check size={14} /> Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thumbnails confirmadas */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.url} alt={`Foto ${i + 1}`} className="h-20 w-20 object-cover border border-neutral-200" />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white flex items-center justify-center text-[12px] font-bold hover:bg-red-700 transition-colors leading-none">
                          ×
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold uppercase bg-black/50 text-white py-0.5">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón agregar */}
                {!editingSrc && images.length < 5 && (
                  <label className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-primary hover:bg-neutral-100 transition-colors cursor-pointer">
                    <Camera size={18} className="text-neutral-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                      {images.length === 0 ? 'Subir foto' : 'Agregar otra foto'}
                    </span>
                    <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                  </label>
                )}

                {images.length === 5 && !editingSrc && (
                  <p className="text-[11px] font-mono text-neutral-400 mt-2">Límite de 5 fotos alcanzado.</p>
                )}
              </div>

              {/* Ubicación seleccionada */}
              <div className="p-6 border-b border-neutral-200">
                <FieldLabel>Ubicación seleccionada</FieldLabel>
                <div className="flex items-start gap-2.5 border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                  <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-[13px] text-neutral-600 leading-snug">
                    {position
                      ? address || `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                      : 'Buscá una dirección o hacé click en el mapa →'}
                  </span>
                </div>
              </div>

              {/* Botón enviar */}
              <div className="p-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {loading
                    ? 'Enviando reporte...'
                    : <><span>Enviar reporte</span><span className="opacity-60">→</span></>}
                </button>
              </div>

            </form>
          </div>

          {/* ── COLUMNA DERECHA: Mapa ── */}
          <div className="bg-white flex flex-col">

            {/* Header del mapa */}
            <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
                Seleccionar ubicación
              </div>
              <form onSubmit={handleSearchAddress} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: Bulevar San Juan 200"
                  className="flex-1 border border-neutral-300 px-3 h-10 text-[13px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="h-10 px-4 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <MagnifyingGlass size={14} />
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </form>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeolocate}
                  disabled={isGeolocating}
                  className="h-9 px-4 border border-primary text-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isGeolocating ? (
                    <>
                      <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Localizando...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                      </svg>
                      Usar mi ubicación
                    </>
                  )}
                </button>
                <span className="text-[10px] font-mono text-neutral-400">
                  o hacé click directamente en el mapa
                </span>
              </div>

              {geoError && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-[11px] font-medium">
                  {geoError}
                </div>
              )}
            </div>

            {/* Mapa */}
            <div className="flex-1 min-h-0 z-0 relative">
              <MapContainer
                center={[-31.4201, -64.1888]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
              </MapContainer>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
