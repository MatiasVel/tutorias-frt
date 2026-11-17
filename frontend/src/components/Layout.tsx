import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = user
    ? [
        { to: '/', label: 'Buscar clases' },
        { to: '/mis-clases', label: 'Mis clases' },
        { to: '/dar-clases', label: 'Dar clases' },
        { to: '/perfil', label: 'Mi perfil' },
        ...(user.role === 'ADMIN' ? [{ to: '/admin', label: 'Administración' }] : []),
      ]
    : [{ to: '/', label: 'Buscar clases' }];

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-800 text-white' : 'text-brand-100 hover:bg-brand-800 hover:text-white'}`;

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:p-2">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 bg-brand-900 shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-white" onClick={() => setOpen(false)}>
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="text-lg font-bold">
              Tutorías <span className="text-amber-400">FRT</span>
            </span>
          </Link>

          {/* Escritorio */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end className={navCls}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={handleLogout} className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-100 hover:bg-brand-800">
                Salir
              </button>
            ) : (
              <>
                <NavLink to="/ingresar" className={navCls}>
                  Ingresar
                </NavLink>
                <Link to="/registro" className="ml-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-amber-300">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>

          {/* Botón menú móvil */}
          <button
            className="rounded-lg p-2 text-white md:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Menú móvil */}
        {open && (
          <nav className="space-y-1 border-t border-brand-800 px-4 pb-4 pt-2 md:hidden" aria-label="Principal móvil">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end className={navCls} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={handleLogout} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-100 hover:bg-brand-800">
                Salir
              </button>
            ) : (
              <>
                <NavLink to="/ingresar" className={navCls} onClick={() => setOpen(false)}>
                  Ingresar
                </NavLink>
                <NavLink to="/registro" className={navCls} onClick={() => setOpen(false)}>
                  Crear cuenta
                </NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Tutorías FRT · Plataforma de clases entre estudiantes de la UTN Facultad Regional Tucumán
      </footer>
    </div>
  );
}
