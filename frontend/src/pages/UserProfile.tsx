import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PublicProfile } from '../api/types';
import { RatingDisplay } from '../components/StarRating';
import ReviewList from '../components/ReviewList';
import { Alert, Spinner, modalityLabel, money } from '../components/ui';

export default function UserProfile() {
  const { id } = useParams();
  const profile = useQuery({ queryKey: ['profile', id], queryFn: () => api<PublicProfile>(`/users/${id}`) });

  if (profile.isLoading) return <Spinner />;
  if (profile.isError || !profile.data) return <Alert>Perfil no encontrado.</Alert>;
  const p = profile.data;
  const asTutor = p.reviewsReceived.filter((r) => r.direction === 'STUDENT_TO_TUTOR');
  const asStudent = p.reviewsReceived.filter((r) => r.direction === 'TUTOR_TO_STUDENT');

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-800">
          {p.firstName[0]}
          {p.lastName[0]}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {p.firstName} {p.lastName}
          </h1>
          {p.career && <p className="text-slate-500">{p.career.name}</p>}
          {p.bio && <p className="text-slate-700">{p.bio}</p>}
        </div>
      </div>

      {p.offerings.length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Materias que enseña</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {p.offerings.map((o) => (
              <li key={o.id}>
                <Link to={`/ofertas/${o.id}`} className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <p className="font-semibold text-brand-800">{o.subject.name}</p>
                  <p className="text-sm text-slate-500">
                    {money(o.pricePerHour)}/h · {modalityLabel[o.modality]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Como tutor/a</h2>
          <RatingDisplay avg={p.tutorRatingAvg} count={p.tutorRatingCount} size="lg" />
          <ReviewList reviews={asTutor} />
        </div>
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Como alumno/a</h2>
          <RatingDisplay avg={p.studentRatingAvg} count={p.studentRatingCount} size="lg" />
          <ReviewList reviews={asStudent} />
        </div>
      </div>
    </div>
  );
}
