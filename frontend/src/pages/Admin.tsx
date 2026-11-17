import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, json, rawRequest } from '../api/client';
import type { OfferingStatus, Role } from '../api/types';
import { Alert, EmptyState, Spinner, StatusBadge, money } from '../components/ui';

interface AdminOffering {
  id: string;
  status: OfferingStatus;
  pricePerHour: string;
  description: string;
  finalGrade: number;
  approvedAt: string;
  proofFileName: string | null;
  createdAt: string;
  subject: { name: string; year: number };
  tutor: { id: string; firstName: string; lastName: string; email: string; legajo: string | null; role: Role };
}
interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  legajo: string | null;
  role: Role;
  isActive: boolean;
  emailVerifiedAt: string | null;
}
interface Stats {
  users: number;
  pendingOfferings: number;
  approvedOfferings: number;
  completedClasses: number;
}

async function openProof(id: string) {
  // Se descarga con el token (la ruta está protegida) y se abre como blob local
  const res = await rawRequest(`/admin/offerings/${id}/proof`);
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function Offerings() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OfferingStatus>('PENDING_REVIEW');
  const list = useQuery({ queryKey: ['admin-offerings', status], queryFn: () => api<AdminOffering[]>(`/admin/offerings?status=${status}`) });

  const decide = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: 'APPROVED' | 'REJECTED'; note?: string }) =>
      api(`/admin/offerings/${id}/review`, { method: 'PATCH', body: json({ decision, note }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }).then(() => qc.invalidateQueries({ queryKey: ['admin-offerings'] })),
  });

  const reject = (id: string) => {
    const note = window.prompt('Motivo del rechazo (lo verá la persona):');
    if (note?.trim()) decide.mutate({ id, decision: 'REJECTED', note: note.trim() });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Publicaciones</h2>
        <select aria-label="Estado" className="input sm:w-56" value={status} onChange={(e) => setStatus(e.target.value as OfferingStatus)}>
          <option value="PENDING_REVIEW">Pendientes de revisión</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
          <option value="PAUSED">Pausadas</option>
        </select>
      </div>
      {decide.isError && <Alert>{(decide.error as Error).message}</Alert>}
      {list.isLoading ? (
        <Spinner />
      ) : list.data?.length === 0 ? (
        <EmptyState title="No hay publicaciones en este estado" />
      ) : (
        <ul className="space-y-3">
          {list.data?.map((o) => (
            <li key={o.id} className="card space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  {o.subject.name} <span className="font-normal text-slate-500">({o.subject.year}° año)</span>
                </p>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-sm">
                {o.tutor.firstName} {o.tutor.lastName} · <span className="break-all">{o.tutor.email}</span>
                {o.tutor.legajo && ` · Legajo ${o.tutor.legajo}`} · {o.tutor.role === 'PROFESSOR' ? 'Docente' : 'Alumno/a'}
              </p>
              <p className="text-sm text-slate-600">
                Nota {o.finalGrade} · Aprobada el {new Date(o.approvedAt).toLocaleDateString('es-AR')} · {money(o.pricePerHour)}/h
              </p>
              <p className="text-sm text-slate-700">{o.description}</p>
              <div className="flex flex-wrap gap-2">
                {o.proofFileName ? (
                  <button className="btn-secondary" onClick={() => openProof(o.id)}>
                    📄 Ver comprobante
                  </button>
                ) : (
                  <span className="text-sm text-slate-500">Sin comprobante</span>
                )}
                {o.status === 'PENDING_REVIEW' && (
                  <>
                    <button className="btn-success" onClick={() => decide.mutate({ id: o.id, decision: 'APPROVED' })}>
                      Aprobar
                    </button>
                    <button className="btn-danger" onClick={() => reject(o.id)}>
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Users() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const list = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api<AdminUser[]>(`/admin/users${search ? `?q=${encodeURIComponent(search)}` : ''}`),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<AdminUser, 'isActive' | 'role'>> }) =>
      api(`/admin/users/${id}`, { method: 'PATCH', body: json(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Usuarios</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
        }}
      >
        <input className="input" placeholder="Nombre, correo o legajo" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-secondary">Buscar</button>
      </form>
      {update.isError && <Alert>{(update.error as Error).message}</Alert>}
      {list.isLoading ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {list.data?.map((u) => (
            <li key={u.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">
                  {u.firstName} {u.lastName} {!u.isActive && <span className="text-xs font-bold text-red-600">SUSPENDIDO</span>}
                </p>
                <p className="break-all text-sm text-slate-500">
                  {u.email} {u.legajo && `· ${u.legajo}`} {!u.emailVerifiedAt && '· sin verificar'}
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  aria-label="Rol"
                  className="input w-36"
                  value={u.role}
                  onChange={(e) => update.mutate({ id: u.id, data: { role: e.target.value as Role } })}
                >
                  <option value="STUDENT">Alumno/a</option>
                  <option value="PROFESSOR">Docente</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  className={u.isActive ? 'btn-danger' : 'btn-success'}
                  onClick={() => {
                    if (window.confirm(u.isActive ? '¿Suspender esta cuenta?' : '¿Reactivar esta cuenta?'))
                      update.mutate({ id: u.id, data: { isActive: !u.isActive } });
                  }}
                >
                  {u.isActive ? 'Suspender' : 'Reactivar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<'offerings' | 'users'>('offerings');
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<Stats>('/admin/stats') });
  const cards: [string, number | undefined][] = [
    ['Usuarios activos', stats.data?.users],
    ['Pendientes de revisión', stats.data?.pendingOfferings],
    ['Publicaciones activas', stats.data?.approvedOfferings],
    ['Clases dictadas', stats.data?.completedClasses],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Administración</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-brand-900">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-1 rounded-xl bg-slate-200 p-1 sm:inline-flex">
        {(['offerings', 'users'] as const).map((t) => (
          <button
            key={t}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold sm:flex-none ${tab === t ? 'bg-white text-brand-900 shadow' : 'text-slate-600'}`}
            onClick={() => setTab(t)}
          >
            {t === 'offerings' ? 'Publicaciones' : 'Usuarios'}
          </button>
        ))}
      </div>
      {tab === 'offerings' ? <Offerings /> : <Users />}
    </div>
  );
}
