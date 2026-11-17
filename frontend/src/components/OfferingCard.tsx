import { Link } from 'react-router-dom';
import type { Offering } from '../api/types';
import { RatingDisplay } from './StarRating';
import { modalityLabel, money } from './ui';

export default function OfferingCard({ o }: { o: Offering }) {
  const initials = `${o.tutor.firstName[0]}${o.tutor.lastName[0]}`.toUpperCase();
  return (
    <Link
      to={`/ofertas/${o.id}`}
      className="card group flex flex-col gap-3 border-t-4 border-t-transparent transition hover:-translate-y-0.5 hover:border-t-brand-500 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">
            {o.tutor.firstName} {o.tutor.lastName}
            {o.tutor.role === 'PROFESSOR' && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">Docente</span>
            )}
          </p>
          <RatingDisplay avg={o.tutor.tutorRatingAvg} count={o.tutor.tutorRatingCount} />
        </div>
      </div>
      <div>
        <p className="text-base font-bold text-ink group-hover:text-brand-700">{o.subject.name}</p>
        <p className="text-xs text-zinc-500">
          {o.subject.year}° año{o.subject.plan ? ` · Plan ${o.subject.plan.year}` : ''} · Aprobada con {o.finalGrade} · {modalityLabel[o.modality]}
        </p>
      </div>
      <p className="line-clamp-2 text-sm text-zinc-600">{o.description}</p>
      <p className="mt-auto text-lg font-bold text-zinc-900">
        {money(o.pricePerHour)} <span className="text-sm font-normal text-zinc-500">/ hora</span>
      </p>
    </Link>
  );
}
