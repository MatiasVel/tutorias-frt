import { Link } from 'react-router-dom';
import type { Offering } from '../api/types';
import { RatingDisplay } from './StarRating';
import { modalityLabel, money } from './ui';

export default function OfferingCard({ o }: { o: Offering }) {
  const initials = `${o.tutor.firstName[0]}${o.tutor.lastName[0]}`.toUpperCase();
  return (
    <Link
      to={`/ofertas/${o.id}`}
      className="card flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-600"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {o.tutor.firstName} {o.tutor.lastName}
            {o.tutor.role === 'PROFESSOR' && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">Docente</span>
            )}
          </p>
          <RatingDisplay avg={o.tutor.tutorRatingAvg} count={o.tutor.tutorRatingCount} />
        </div>
      </div>
      <div>
        <p className="text-base font-bold text-brand-900">{o.subject.name}</p>
        <p className="text-xs text-slate-500">
          {o.subject.year}° año · Aprobada con {o.finalGrade} · {modalityLabel[o.modality]}
        </p>
      </div>
      <p className="line-clamp-2 text-sm text-slate-600">{o.description}</p>
      <p className="mt-auto text-lg font-bold text-slate-900">
        {money(o.pricePerHour)} <span className="text-sm font-normal text-slate-500">/ hora</span>
      </p>
    </Link>
  );
}
