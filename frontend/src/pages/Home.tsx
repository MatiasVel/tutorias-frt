import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCareers, usePlans, useSubjects } from '../api/hooks';
import type { Modality, Offering, Paginated } from '../api/types';
import OfferingCard from '../components/OfferingCard';
import SubjectSelect from '../components/SubjectSelect';
import { Alert, EmptyState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [careerId, setCareerId] = useState<number | undefined>(user?.career?.id);
  const [planId, setPlanId] = useState<number | undefined>();
  const [subjectId, setSubjectId] = useState<number | undefined>();
  const [modality, setModality] = useState<Modality | ''>('');
  const [sort, setSort] = useState('rating');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const careers = useCareers();
  const plans = usePlans(careerId);
  const subjects = useSubjects(careerId, planId);

  const params = new URLSearchParams();
  if (careerId) params.set('careerId', String(careerId));
  if (planId) params.set('planId', String(planId));
  if (subjectId) params.set('subjectId', String(subjectId));
  if (modality) params.set('modality', modality);
  if (query) params.set('q', query);
  params.set('sort', sort);
  params.set('page', String(page));

  const offerings = useQuery({
    queryKey: ['offerings', params.toString()],
    queryFn: () => api<Paginated<Offering>>(`/offerings?${params}`),
    placeholderData: keepPreviousData,
  });

  const totalPages = offerings.data ? Math.max(1, Math.ceil(offerings.data.total / offerings.data.pageSize)) : 1;

  return (
    <div className="space-y-10">
      {/* Hero: ocupa todo el ancho, con la tarjeta de búsqueda superpuesta (estilo institucional) */}
      <section className="hero-bg relative -mx-4 -mt-6 px-4 pt-12 pb-28 text-white sm:-mt-10 sm:pt-20 sm:pb-36 lg:mx-[calc(50%-50vw)] lg:px-[calc(50vw-50%)]">
        <p className="text-xs font-bold tracking-[0.25em] text-brand-500 uppercase">UTN · Facultad Regional Tucumán</p>
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          Aprendé con quienes ya aprobaron la materia
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-300 sm:text-lg">
          Clases particulares entre estudiantes y docentes de la facultad. Si ya aprobaste una materia, enseñala y generá ingresos.
        </p>
      </section>

      <section className="relative z-10 -mt-24 sm:-mt-28">
        <form
          className="card flex flex-col gap-3 border-t-4 border-t-brand-500 p-4 shadow-xl sm:flex-row sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(q);
          }}
          role="search"
        >
          <label htmlFor="q" className="sr-only">
            Buscar materia o tutor
          </label>
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="q"
              className="input py-3 pl-10"
              placeholder="Buscá una materia o un tutor: Análisis Matemático, Física, Algoritmos…"
              value={q}
              maxLength={80}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn-primary px-8 py-3">Buscar</button>
        </form>
        {!user && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['01', 'Creá tu cuenta', 'Con tu correo institucional de la FRT.'],
              ['02', 'Reservá una clase', 'Elegí materia, día y horario con quien mejor te sirva.'],
              ['03', 'Puntuá la experiencia', 'Alumno y tutor se califican mutuamente al finalizar.'],
            ].map(([n, t, d]) => (
              <div key={n} className="card flex gap-4">
                <span className="text-2xl font-extrabold text-brand-500">{n}</span>
                <div>
                  <p className="font-semibold text-ink">{t}</p>
                  <p className="text-sm text-zinc-500">{d}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 className="section-title">Clases disponibles</h2>

      <section aria-label="Filtros" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          aria-label="Carrera"
          className="input"
          value={careerId ?? ''}
          onChange={(e) => {
            setCareerId(e.target.value ? Number(e.target.value) : undefined);
            setPlanId(undefined);
            setSubjectId(undefined);
            setPage(1);
          }}
        >
          <option value="">Todas las carreras</option>
          {careers.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Plan de estudios"
          className="input"
          value={planId ?? ''}
          onChange={(e) => {
            setPlanId(e.target.value ? Number(e.target.value) : undefined);
            setSubjectId(undefined);
            setPage(1);
          }}
        >
          <option value="">Todos los planes</option>
          {plans.map((pl) => (
            <option key={pl.id} value={pl.id}>
              Plan {pl.year}
              {pl.isCurrent ? ' (vigente)' : ''}
            </option>
          ))}
        </select>
        <SubjectSelect
          id="subject-filter"
          subjects={subjects.data ?? []}
          value={subjectId ? String(subjectId) : ''}
          placeholder="Todas las materias"
          onChange={(v) => {
            setSubjectId(v ? Number(v) : undefined);
            setPage(1);
          }}
        />
        <select
          aria-label="Modalidad"
          className="input"
          value={modality}
          onChange={(e) => {
            setModality(e.target.value as Modality | '');
            setPage(1);
          }}
        >
          <option value="">Cualquier modalidad</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="VIRTUAL">Virtual</option>
        </select>
        <select aria-label="Ordenar por" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rating">Mejor puntuados</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
          <option value="recent">Más recientes</option>
        </select>
      </section>

      {offerings.isLoading ? (
        <Spinner />
      ) : offerings.isError ? (
        <Alert>No pudimos cargar las clases. Probá de nuevo en unos segundos.</Alert>
      ) : offerings.data!.items.length === 0 ? (
        <EmptyState title="Todavía no hay clases para esta búsqueda">
          ¿Aprobaste esta materia?{' '}
          <Link className="font-semibold text-brand-700 underline" to="/dar-clases">
            Sé la primera persona en ofrecerla
          </Link>
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-zinc-500">{offerings.data!.total} resultado(s)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.data!.items.map((o) => (
              <OfferingCard key={o.id} o={o} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3" aria-label="Paginación">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </button>
              <span className="text-sm text-zinc-600">
                Página {page} de {totalPages}
              </span>
              <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
