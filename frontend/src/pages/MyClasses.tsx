import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, json } from '../api/client';
import type { Booking } from '../api/types';
import { RatingDisplay } from '../components/StarRating';
import ReviewModal from '../components/ReviewModal';
import { Alert, EmptyState, Spinner, StatusBadge, dateTime, modalityLabel, money } from '../components/ui';

type Tab = 'student' | 'tutor';
type Action = 'confirm' | 'reject' | 'complete' | 'cancel';

export default function MyClasses() {
  const location = useLocation();
  const justBooked = (location.state as { booked?: boolean } | null)?.booked;
  const [tab, setTab] = useState<Tab>('student');
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const qc = useQueryClient();

  const bookings = useQuery({
    queryKey: ['bookings', tab],
    queryFn: () => api<Booking[]>(`/bookings?as=${tab}`),
  });

  const action = useMutation({
    mutationFn: ({ id, act }: { id: string; act: Action }) => api(`/bookings/${id}/${act}`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const confirmAndRun = (id: string, act: Action, question?: string) => {
    if (question && !window.confirm(question)) return;
    action.mutate({ id, act });
  };

  const sendReview = async (rating: number, comment: string) => {
    await api('/reviews', { method: 'POST', body: json({ bookingId: reviewing!.id, rating, comment: comment || undefined }) });
    await qc.invalidateQueries({ queryKey: ['bookings'] });
  };

  const tabCls = (t: Tab) =>
    `flex-1 rounded-lg px-4 py-2 text-sm font-semibold sm:flex-none ${tab === t ? 'bg-white text-ink shadow' : 'text-zinc-600'}`;

  return (
    <div className="space-y-6">
      <h1 className="section-title text-2xl">Mis clases</h1>
      {justBooked && <Alert kind="success">¡Solicitud enviada! Te avisamos acá cuando la confirmen.</Alert>}

      <div className="flex gap-1 rounded-xl bg-zinc-200 p-1 sm:inline-flex" role="tablist">
        <button role="tab" aria-selected={tab === 'student'} className={tabCls('student')} onClick={() => setTab('student')}>
          Clases que tomo
        </button>
        <button role="tab" aria-selected={tab === 'tutor'} className={tabCls('tutor')} onClick={() => setTab('tutor')}>
          Clases que doy
        </button>
      </div>

      {action.isError && <Alert>{(action.error as Error).message}</Alert>}

      {bookings.isLoading ? (
        <Spinner />
      ) : bookings.isError ? (
        <Alert>No pudimos cargar tus clases.</Alert>
      ) : bookings.data!.length === 0 ? (
        <EmptyState title={tab === 'student' ? 'Todavía no reservaste clases' : 'Todavía no recibiste solicitudes'}>
          {tab === 'student' ? (
            <Link to="/" className="font-semibold text-brand-700 underline">
              Buscar una clase
            </Link>
          ) : (
            <Link to="/dar-clases" className="font-semibold text-brand-700 underline">
              Publicá una materia que hayas aprobado
            </Link>
          )}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {bookings.data!.map((b) => {
            const other = tab === 'student' ? b.offering.tutor : b.student;
            const otherRating =
              tab === 'student'
                ? { avg: other.tutorRatingAvg, count: other.tutorRatingCount }
                : { avg: other.studentRatingAvg, count: other.studentRatingCount };
            const past = new Date(b.scheduledAt) < new Date();
            return (
              <li key={b.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-zinc-900">{b.offering.subject.name}</p>
                    <p className="text-sm text-zinc-500">
                      {dateTime(b.scheduledAt)} · {b.durationMinutes} min · {modalityLabel[b.offering.modality]}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                  <p>
                    <span className="text-zinc-500">{tab === 'student' ? 'Da la clase:' : 'Alumno/a:'}</span>{' '}
                    <Link to={`/usuarios/${other.id}`} className="font-semibold text-brand-700 hover:underline">
                      {other.firstName} {other.lastName}
                    </Link>
                  </p>
                  <RatingDisplay avg={otherRating.avg} count={otherRating.count} />
                  {other.email && (
                    <p className="mt-2 break-all">
                      ✉️ <a className="text-brand-700 underline" href={`mailto:${other.email}`}>{other.email}</a>
                      {other.phone && (
                        <>
                          {' '}· 📞 <a className="text-brand-700 underline" href={`tel:${other.phone}`}>{other.phone}</a>
                        </>
                      )}
                    </p>
                  )}
                </div>

                {b.message && <p className="text-sm italic text-zinc-600">“{b.message}”</p>}
                <p className="text-sm">
                  Total: <strong>{money(b.priceAgreed)}</strong>
                </p>

                <div className="flex flex-wrap gap-2">
                  {tab === 'tutor' && b.status === 'PENDING' && (
                    <>
                      <button className="btn-success flex-1 sm:flex-none" onClick={() => confirmAndRun(b.id, 'confirm')}>
                        Aceptar
                      </button>
                      <button className="btn-secondary flex-1 sm:flex-none" onClick={() => confirmAndRun(b.id, 'reject', '¿Rechazar esta solicitud?')}>
                        Rechazar
                      </button>
                    </>
                  )}
                  {tab === 'tutor' && b.status === 'CONFIRMED' && past && (
                    <button className="btn-primary flex-1 sm:flex-none" onClick={() => confirmAndRun(b.id, 'complete', '¿Confirmás que la clase se dictó?')}>
                      Marcar como dictada
                    </button>
                  )}
                  {(b.status === 'PENDING' || b.status === 'CONFIRMED') && !past && (
                    <button className="btn-secondary flex-1 sm:flex-none" onClick={() => confirmAndRun(b.id, 'cancel', '¿Cancelar la clase?')}>
                      Cancelar
                    </button>
                  )}
                  {b.status === 'COMPLETED' && !b.myReview && (
                    <button className="btn-primary flex-1 sm:flex-none" onClick={() => setReviewing(b)}>
                      ⭐ Puntuar {tab === 'student' ? 'a quien dio la clase' : 'al alumno/a'}
                    </button>
                  )}
                  {b.myReview && (
                    <p className="text-sm text-zinc-500">
                      Tu puntuación: <strong>{b.myReview.rating}/5</strong>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {reviewing && (
        <ReviewModal
          title={
            tab === 'student'
              ? `¿Cómo fue la clase con ${reviewing.offering.tutor.firstName}?`
              : `¿Cómo fue ${reviewing.student.firstName} como alumno/a?`
          }
          onClose={() => setReviewing(null)}
          onSubmit={sendReview}
        />
      )}
    </div>
  );
}
