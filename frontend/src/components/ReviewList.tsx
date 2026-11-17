import type { Review } from '../api/types';
import { RatingDisplay } from './StarRating';

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return <p className="text-sm text-slate-500">Todavía no hay opiniones.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {reviews.map((r) => (
        <li key={r.id} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">
              {r.author.firstName} {r.author.lastName[0]}.
            </span>
            <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
          <RatingDisplay avg={r.rating} count={1} />
          {/* React escapa el texto: un comentario con HTML/JS no se ejecuta (protección XSS) */}
          {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
