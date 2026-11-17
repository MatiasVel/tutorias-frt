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
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-900 to-brand-700 px-6 py-10 text-white sm:px-10">
        <h1 className="text-2xl font-extrabold sm:text-4xl">Aprendé con quienes ya aprobaron la materia</h1>
        <p className="mt-3 max-w-2xl text-brand-100 sm:text-lg">
          Clases particulares entre estudiantes y docentes de la UTN Facultad Regional Tucumán. Si ya aprobaste una materia, podés
          enseñarla y generar ingresos.
        </p>
        <form
          className="mt-6 flex flex-col gap-2 sm:flex-row"
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
          <input
            id="q"
            className="input flex-1 text-slate-900"
            placeholder="Ej.: Análisis Matemático, Física, Algoritmos…"
            value={q}
            maxLength={80}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn bg-amber-400 text-brand-900 hover:bg-amber-300">Buscar</button>
        </form>
        {!user && (
          <p className="mt-4 text-sm text-brand-100">
            ¿Querés dar clases?{' '}
            <Link to="/registro" className="font-semibold text-amber-300 underline">
              Creá tu cuenta con tu correo institucional
            </Link>
          </p>
        )}
      </section>

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
          <p className="text-sm text-slate-500">{offerings.data!.total} resultado(s)</p>
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
              <span className="text-sm text-slate-600">
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
