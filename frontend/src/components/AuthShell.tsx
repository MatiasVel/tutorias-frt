import type { ReactNode } from 'react';

/** Marco de las pantallas de acceso: panel negro institucional + tarjeta blanca. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl md:grid-cols-5">
      <aside className="hero-bg hidden flex-col justify-between p-8 text-white md:col-span-2 md:flex">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-brand-500 uppercase">UTN · FRT</p>
          <p className="mt-4 text-2xl leading-snug font-extrabold">Clases entre estudiantes de la facultad</p>
          <p className="mt-3 text-sm text-zinc-400">Aprendé con quienes ya aprobaron la materia o enseñá lo que ya sabés.</p>
        </div>
        <ul className="space-y-3 text-sm text-zinc-300">
          {['Solo cuentas institucionales', 'Datos personales cifrados', 'Puntuaciones verificadas'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </aside>
      <div className="space-y-5 p-6 sm:p-10 md:col-span-3">
        <div>
          <h1 className="section-title text-2xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
