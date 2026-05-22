// src/pages/Landing.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import Hero from '../components/Hero';
import CategoriesStrip from '../components/CategoriesStrip';
import MapFeed from '../components/MapFeed';
import { HowItWorks, ActivityBar, ClosingCTA, Footer } from '../components/Sections';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const CATEGORY_COLORS = {
  baches:       '#EF4444',
  alumbrado:    '#8B5CF6',
  residuos:     '#F97316',
  construccion: '#FACC15',
  extravios:    '#0EA5E9',
};

function extractBarrio(address) {
  if (!address) return null;
  const parts = address.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[1] : null;
}

function computeStats(reports) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const catMap    = {};
  const barrioMap = {};

  reports.forEach(r => {
    if (r.category) catMap[r.category] = (catMap[r.category] || 0) + 1;
    const b = extractBarrio(r.address);
    if (b) barrioMap[b] = (barrioMap[b] || 0) + 1;
  });

  return {
    total:    reports.length,
    pending:  reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    thisWeek: reports.filter(r => new Date(r.created_at).getTime() >= weekAgo).length,
    barrios:  Object.keys(barrioMap).length,
    catMap,
    barrioMap,
  };
}

export default function Landing() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/reports`)
      .then(({ data }) => setReports(data))
      .catch(err => console.error('Error cargando reportes:', err));
  }, []);

  const stats          = computeStats(reports);
  const resolvedReports = reports
    .filter(r => r.status === 'resolved')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero stats={stats} reports={reports} />
      <ActivityBar reports={resolvedReports} categoryColors={CATEGORY_COLORS} />
      <CategoriesStrip catCounts={stats.catMap} />
      <MapFeed />
      <HowItWorks />
      <ClosingCTA />
      <Footer />
    </div>
  );
}
