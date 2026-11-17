import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Tutorías FRT, inicio">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <span className="flex items-center gap-2 text-[15px] font-bold tracking-[0.18em] text-white uppercase">
        Tutorías
        <span className="h-4 w-px bg-zinc-600" aria-hidden="true" />
        <span className="text-brand-500">FRT</span>
      </span>
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Cierra el menú móvil al cambiar de página
  useEffect(() => setOpen(false), [location.pathname]);

  const links = user
    ? [
        { to: '/', label: 'Buscar clases' },
        { to: '/mis-clases', label: 'Mis clases' },
        { to: '/dar-clases', label: 'Dar clases' },
        { to: '/perfil', label: 'Mi perfil' },
        ...(user.role === 'ADMIN' ? [{ to: '/admin', label: 'Administración' }] : []),
      ]
    : [{ to: '/', label: 'Buscar clases' }];

  const deskCls = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 text-[13px] font-semibold tracking-wide uppercase transition ${
      isActive
        ? 'text-white after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[3px] after:bg-brand-500'
        : 'text-zinc-400 hover:text-white'
    }`;
  const mobileCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wide ${
      isActive ? 'border-l-4 border-brand-500 bg-ink-soft text-white' : 'text-zinc-300 hover:bg-ink-soft'
    }`;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />

          {/* Escritorio */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end className={deskCls}>
                {l.label}
              </NavLink>
            ))}
            <span className="mx-2 h-6 w-px bg-zinc-700" aria-hidden="true" />
            {user ? (
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
                <button onClick={handleLogout} className="text-[13px] font-semibold tracking-wide text-zinc-400 uppercase hover:text-white">
                  Salir
                </button>
              </div>
            ) : (
              <>
                <NavLink to="/ingresar" className={deskCls}>
                  Ingresar
                </NavLink>
                <Link to="/registro" className="btn-primary ml-1 px-4 py-2 text-[13px] tracking-wide uppercase">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>

          {/* Botón menú móvil */}
          <button
            className="rounded-lg p-2 text-white hover:bg-ink-soft md:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Menú móvil */}
        {open && (
          <nav className="space-y-1 border-t border-white/10 px-4 pt-2 pb-4 md:hidden" aria-label="Principal móvil">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end className={mobileCls}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold tracking-wide text-zinc-300 uppercase hover:bg-ink-soft"
              >
                Salir
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/ingresar" className="btn border border-zinc-600 text-white">
                  Ingresar
                </Link>
                <Link to="/registro" className="btn-primary">
                  Crear cuenta
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>

      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t-4 border-brand-500 bg-ink text-zinc-400">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
          <div className="space-y-3">
            <Logo />
            <p className="text-xs leading-relaxed">Clases particulares entre estudiantes y docentes de la UTN Facultad Regional Tucumán.</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold tracking-widest text-white uppercase">Plataforma</p>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white">Buscar clases</Link>
              </li>
              <li>
                <Link to="/dar-clases" className="hover:text-white">Dar clases</Link>
              </li>
              <li>
                <Link to="/registro" className="hover:text-white">Crear cuenta</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold tracking-widest text-white uppercase">Tus datos, protegidos</p>
            <p className="text-xs leading-relaxed">
              Contraseñas con Argon2id, datos personales cifrados con AES-256 y conexión segura. Acceso exclusivo con correo institucional.
            </p>
          </div>
        </div>
        <p className="border-t border-white/5 py-4 text-center text-xs">© {new Date().getFullYear()} Tutorías FRT</p>
      </footer>
    </div>
  );
}
