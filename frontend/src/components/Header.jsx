// src/components/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Icons';
import { useDarkMode } from '../context/DarkModeContext';

export function DarkModeToggle() {
  const { dark, setDark } = useDarkMode();
  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="w-9 h-9 flex items-center justify-center border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
    >
      {dark ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/iniciar-sesion');
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-[600]">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="flex justify-between items-center h-16">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5">
            <Logo />
            <span className="font-heading font-bold tracking-tight text-[22px] text-neutral-900">InfoVía</span>
            <span className="hidden md:inline-block ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200">
              Córdoba
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#categorias" className="text-[12px] font-semibold uppercase tracking-widest text-neutral-600 hover:text-neutral-900">Categorías</a>
            <a href="#mapa" className="text-[12px] font-semibold uppercase tracking-widest text-neutral-600 hover:text-neutral-900">Mapa</a>
            <a href="#como" className="text-[12px] font-semibold uppercase tracking-widest text-neutral-600 hover:text-neutral-900">Cómo funciona</a>
            <a href="#sumate" className="text-[12px] font-semibold uppercase tracking-widest text-neutral-600 hover:text-neutral-900">Sumate</a>
          </nav>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {user ? (
              <>
                <Link to="/nuevo-reporte">
                  <button className="h-9 px-4 bg-[#7C3AED] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors inline-flex items-center">
                    Nuevo Reporte
                  </button>
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin">
                    <button className="hidden sm:inline-flex h-9 px-4 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-colors items-center">
                      Panel Admin
                    </button>
                  </Link>
                )}
                <span className="hidden sm:inline-flex h-9 px-4 border border-neutral-200 text-[11px] font-bold uppercase tracking-widest text-neutral-700 items-center">
                  {user.name}
                </span>
                <button onClick={handleLogout}
                  className="h-9 px-3 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors inline-flex items-center">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/iniciar-sesion">
                  <button className="hidden sm:inline-flex h-9 px-4 border border-neutral-300 text-[11px] font-bold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-colors items-center">
                    Iniciar sesión
                  </button>
                </Link>
                <Link to="/registro">
                  <button className="h-9 px-4 bg-[#7C3AED] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#6D28D9] transition-colors inline-flex items-center">
                    Registrarse
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}