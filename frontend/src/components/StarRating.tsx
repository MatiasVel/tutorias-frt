import { useState } from 'react';

function Star({ filled, className = 'h-5 w-5' }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`${className} ${filled ? 'text-brand-500' : 'text-zinc-300'}`} fill="currentColor">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
    </svg>
  );
}

/** Muestra el promedio y la cantidad de puntuaciones. */
export function RatingDisplay({ avg, count, size = 'sm' }: { avg: number; count: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  if (count === 0) return <span className="text-sm text-zinc-500">Sin puntuaciones aún</span>;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${avg.toFixed(1)} de 5, ${count} puntuaciones`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= Math.round(avg)} className={cls} />
      ))}
      <span className="ml-1 text-sm font-semibold text-zinc-700">{avg.toFixed(1)}</span>
      <span className="text-sm text-zinc-500">({count})</span>
    </span>
  );
}

/** Selector accesible de 1 a 5 estrellas (funciona con teclado y táctil). */
export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];
  return (
    <div>
      <div className="flex gap-1" role="radiogroup" aria-label="Puntuación" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
            className="rounded p-1 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <Star filled={i <= (hover || value)} className="h-9 w-9" />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm text-zinc-600">{labels[hover || value]}</p>
    </div>
  );
}
