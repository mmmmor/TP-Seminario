import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Icons';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(email, password, name);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

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

      {/* Barra superior */}
      <header className="relative z-10 bg-white border-b border-neutral-200 sticky top-0">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <Logo />
            <span className="font-heading font-bold tracking-tight text-[22px] text-neutral-900">
              InfoVía
            </span>
            <span className="hidden md:inline-block ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200">
              Córdoba
            </span>
          </Link>
          <Link
            to="/iniciar-sesion"
            className="h-9 px-4 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-colors inline-flex items-center no-underline"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[420px]">

          {/* Eyemark */}
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400 mb-5">
            Registro · InfoVía
          </div>

          {/* Título */}
          <div className="flex items-start gap-16 mb-10">
            <h1 className="font-heading font-bold text-[52px] tracking-[-0.03em] text-neutral-900 leading-[0.92]">
              Crear<br />cuenta.
            </h1>
            <div className="w-24 h-24 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full">
              <Logo />
            </div>
          </div>

          {/* Card del formulario */}
          <div className="bg-white border border-neutral-200">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-[12px] font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Tu nombre completo"
                  className="w-full border border-neutral-300 px-3 h-11 text-[14px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full border border-neutral-300 px-3 h-11 text-[14px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-neutral-300 px-3 h-11 text-[14px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading ? 'Creando cuenta...' : <><span>Crear cuenta</span><span className="opacity-60">→</span></>}
              </button>

            </form>

            {/* Footer del card */}
            <div className="px-8 py-4 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400">¿Ya tenés cuenta?</span>
              <Link
                to="/iniciar-sesion"
                className="text-[11px] font-bold uppercase tracking-widest text-primary hover:text-[#6D28D9] transition-colors no-underline"
              >
                Iniciar sesión →
              </Link>
            </div>
          </div>

          {/* Volver al inicio */}
          <div className="mt-8 text-[11px] font-mono text-neutral-400">
            ←{' '}
            <Link to="/" className="hover:text-neutral-700 transition-colors no-underline">
              Volver al inicio
            </Link>
          </div>

        </div>
      </main>

    </div>
  );
}
