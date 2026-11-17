import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, json } from '../api/client';
import type { Offering, Review } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { RatingDisplay } from '../components/StarRating';
import { Alert, Field, Spinner, dateTime, modalityLabel, money } from '../components/ui';
import ReviewList from '../components/ReviewList';

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OfferingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const offering = useQuery({ queryKey: ['offering', id], queryFn: () => api<Offering>(`/offerings/${id}`) });
  const tutorId = offering.data?.tutor.id;
  const reviews = useQuery({
    queryKey: ['reviews', tutorId, 'tutor'],
    queryFn: () => api<Review[]>(`/reviews/user/${tutorId}?direction=STUDENT_TO_TUTOR`),
    enabled: !!tutorId && !!user,
  });

  const minDate = toLocalInput(new Date(Date.now() + 61 * 60_000));
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState('');

  const book = useMutation({
    mutationFn: () =>
      api('/bookings', {
        method: 'POST',
        body: json({
          offeringId: id,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes: duration,
          message: message || undefined,
        }),
      }),
    onSuccess: () => navigate('/mis-clases', { state: { booked: true } }),
  });

  if (offering.isLoading) return <Spinner />;
  if (offering.isError || !offering.data) return <Alert>La clase no existe o ya no está disponible.</Alert>;
  const o = offering.data;
  const isOwn = user?.id === o.tutor.id;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    book.mutate();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{o.subject.year}° año</p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{o.subject.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>{modalityLabel[o.modality]}</span>
            <span>Aprobada con {o.finalGrade}</span>
            <span>Aprobó el {new Date(o.approvedAt).toLocaleDateString('es-AR')}</span>
          </div>
          <p className="whitespace-pre-line text-slate-700">{o.description}</p>
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Sobre quien da la clase</h2>
          <p className="font-semibold">
            {user ? (
              <Link to={`/usuarios/${o.tutor.id}`} className="text-brand-700 hover:underline">
                {o.tutor.firstName} {o.tutor.lastName}
              </Link>
            ) : (
              `${o.tutor.firstName} ${o.tutor.lastName}`
            )}
          </p>
          {o.tutor.career && <p className="text-sm text-slate-500">{o.tutor.career.name}</p>}
          <RatingDisplay avg={o.tutor.tutorRatingAvg} count={o.tutor.tutorRatingCount} size="lg" />
          {o.tutor.bio && <p className="text-sm text-slate-700">{o.tutor.bio}</p>}
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Opiniones de alumnos</h2>
          {!user ? (
            <p className="text-sm text-slate-500">Ingresá para ver las opiniones.</p>
          ) : reviews.isLoading ? (
            <Spinner />
          ) : (
            <ReviewList reviews={reviews.data ?? []} />
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-4">
          <p className="text-3xl font-extrabold text-slate-900">
            {money(o.pricePerHour)} <span className="text-base font-normal text-slate-500">/ hora</span>
          </p>
          {!user ? (
            <Link to="/ingresar" state={{ from: `/ofertas/${o.id}` }} className="btn-primary w-full">
              Ingresá para reservar
            </Link>
          ) : isOwn ? (
            <Alert kind="info">Esta es tu propia oferta.</Alert>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {book.isError && <Alert>{(book.error as Error).message}</Alert>}
              <Field label="Día y hora" htmlFor="when">
                <input id="when" type="datetime-local" required min={minDate} className="input" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </Field>
              <Field label="Duración" htmlFor="dur">
                <select id="dur" className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[30, 60, 90, 120, 180].map((m) => (
                    <option key={m} value={m}>
                      {m < 60 ? `${m} minutos` : `${m / 60} hora${m > 60 ? 's' : ''}`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mensaje (opcional)" htmlFor="msg" hint="Contá qué temas necesitás repasar.">
                <textarea id="msg" rows={3} maxLength={500} className="input" value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>Total estimado</span>
                <strong>{money((Number(o.pricePerHour) * duration) / 60)}</strong>
              </div>
              {scheduledAt && <p className="text-xs text-slate-500">Solicitás: {dateTime(new Date(scheduledAt).toISOString())}</p>}
              <button className="btn-primary w-full" disabled={book.isPending}>
                {book.isPending ? 'Enviando…' : 'Solicitar clase'}
              </button>
              <p className="text-xs text-slate-500">
                El pago se acuerda directamente. Los datos de contacto se muestran cuando la clase se confirma.
              </p>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
