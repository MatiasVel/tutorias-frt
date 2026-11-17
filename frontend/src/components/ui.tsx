import type { ReactNode } from 'react';
import type { BookingStatus, Modality, OfferingStatus } from '../api/types';

export function Spinner() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Cargando">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" />
    </div>
  );
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-brand-100 bg-brand-50 text-ink',
  }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card py-12 text-center">
      <p className="text-lg font-semibold text-zinc-700">{title}</p>
      {children && <div className="mt-2 text-sm text-zinc-500">{children}</div>}
    </div>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

const bookingStatus: Record<BookingStatus, [string, string]> = {
  PENDING: ['Pendiente', 'bg-amber-100 text-amber-800'],
  CONFIRMED: ['Confirmada', 'bg-sky-100 text-sky-800'],
  REJECTED: ['Rechazada', 'bg-zinc-200 text-zinc-700'],
  CANCELLED: ['Cancelada', 'bg-zinc-200 text-zinc-700'],
  COMPLETED: ['Finalizada', 'bg-emerald-100 text-emerald-800'],
};
const offeringStatus: Record<OfferingStatus, [string, string]> = {
  PENDING_REVIEW: ['En revisión', 'bg-amber-100 text-amber-800'],
  APPROVED: ['Publicada', 'bg-emerald-100 text-emerald-800'],
  REJECTED: ['Rechazada', 'bg-red-100 text-red-800'],
  PAUSED: ['Pausada', 'bg-zinc-200 text-zinc-700'],
};

export function StatusBadge({ status }: { status: BookingStatus | OfferingStatus }) {
  const [text, cls] =
    (bookingStatus as Record<string, [string, string]>)[status] ??
    (offeringStatus as Record<string, [string, string]>)[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>;
}

export const modalityLabel: Record<Modality, string> = {
  PRESENCIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  AMBAS: 'Presencial o virtual',
};

export const money = (v: string | number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(v));

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
