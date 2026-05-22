import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReportMap } from '../components/ReportMap';
import { ReportCard } from '../components/ReportCard';
import { Funnel } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await axios.get(`${API}/reports`);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/reports/stats`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  return (
    <div className="flex-1" data-testid="home-page">
      {/* HERO SECTION */}
      <div
        className="relative bg-cover bg-center py-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.6) 0%, transparent 100%), url(https://turismo.cordoba.gob.ar/wp-content/uploads/2022/03/Rio-Suquia-3.jpg)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tighter text-white mb-6">
            InfoVía
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Plataforma ciudadana para reportar problemas urbanos en Córdoba. <br />
            Juntos mejoramos nuestra ciudad.
          </p>
          
          {/* ESTADÍSTICAS */}
          {stats && (
            <div className="mt-8 flex justify-center gap-8 text-white">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm uppercase tracking-wider">Total Reportes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-status-pending">{stats.pending}</div>
                <div className="text-sm uppercase tracking-wider">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-status-resolved">{stats.resolved}</div>
                <div className="text-sm uppercase tracking-wider">Resueltos</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* MAPA */}
          <div className="border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-xl font-heading font-semibold">Mapa de Reportes</h2>
            </div>
            <div className="h-[500px]">
              <ReportMap reports={filteredReports} />
            </div>
          </div>

          {/* FEED DE REPORTES */}
          <div className="border border-gray-200 bg-white shadow-sm flex flex-col h-[550px]">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold">Reportes</h2>
              <Funnel size={20} className="text-gray-500" />
            </div>
            
            {/* PESTAÑAS (TABS) */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 text-sm font-medium ${filter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Todos ({reports.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`flex-1 py-2 text-sm font-medium ${filter === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Pendientes ({reports.filter((r) => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`flex-1 py-2 text-sm font-medium ${filter === 'resolved' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Resueltos ({reports.filter((r) => r.status === 'resolved').length})
              </button>
            </div>

            {/* LISTA ESCROLEABLE */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay reportes para mostrar. ¡Sé el primero en reportar un problema!
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}