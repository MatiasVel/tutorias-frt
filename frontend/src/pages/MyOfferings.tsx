import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, json } from '../api/client';
import { useCareers, usePlans, useSubjects } from '../api/hooks';
import SubjectSelect from '../components/SubjectSelect';
import type { Modality, MyOffering } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Alert, EmptyState, Field, Spinner, StatusBadge, modalityLabel, money } from '../components/ui';

const MAX_MB = 5;

function NewOfferingForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const careers = useCareers();
  const [careerId, setCareerId] = useState<number | undefined>(user?.career?.id);
  const plans = usePlans(careerId);
  const [planId, setPlanId] = useState<number | undefined>(user?.studyPlan?.id);
  const effectivePlanId = planId ?? plans[0]?.id;
  const subjects = useSubjects(careerId, effectivePlanId);
  const [form, setForm] = useState({ subjectId: '', pricePerHour: '', modality: 'AMBAS' as Modality, description: '', finalGrade: '', approvedAt: '' });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isStudent = user?.role === 'STUDENT';

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (isStudent && !file) return setError('Adjuntá el comprobante de la materia aprobada');
    if (file && file.size > MAX_MB * 1024 * 1024) return setError(`El archivo supera los ${MAX_MB} MB`);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('proof', file);
    setBusy(true);
    try {
      await api('/offerings', { method: 'POST', body: fd });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Publicar una materia</h2>
      {error && (
        <div className="sm:col-span-2">
          <Alert>{error}</Alert>
        </div>
      )}
      <Field label="Carrera" htmlFor="career">
        <select
          id="career"
          className="input"
          value={careerId ?? ''}
          onChange={(e) => {
            setCareerId(e.target.value ? Number(e.target.value) : undefined);
            setPlanId(undefined);
            setForm((f) => ({ ...f, subjectId: '' }));
          }}
        >
          <option value="">Todas</option>
          {careers.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Plan de estudios" htmlFor="plan" hint="El plan con el que cursaste la materia.">
        <select
          id="plan"
          className="input"
          value={effectivePlanId ?? ''}
          onChange={(e) => {
            setPlanId(Number(e.target.value));
            setForm((f) => ({ ...f, subjectId: '' }));
          }}
        >
          {plans.map((pl) => (
            <option key={pl.id} value={pl.id}>
              Plan {pl.year}
              {pl.isCurrent ? ' (vigente)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Materia aprobada" htmlFor="subject">
          <SubjectSelect
            id="subject"
            required
            subjects={subjects.data ?? []}
            value={form.subjectId}
            placeholder="Seleccioná…"
            onChange={(v) => setForm((f) => ({ ...f, subjectId: v }))}
          />
        </Field>
      </div>
      <Field label="Nota de aprobación" htmlFor="grade">
        <input id="grade" type="number" min={4} max={10} required className="input" value={form.finalGrade} onChange={set('finalGrade')} />
      </Field>
      <Field label="Fecha de aprobación" htmlFor="approvedAt">
        <input id="approvedAt" type="date" required max={new Date().toISOString().slice(0, 10)} className="input" value={form.approvedAt} onChange={set('approvedAt')} />
      </Field>
      <Field label="Precio por hora (ARS)" htmlFor="price">
        <input id="price" type="number" min={0} step={100} required inputMode="numeric" className="input" value={form.pricePerHour} onChange={set('pricePerHour')} />
      </Field>
      <Field label="Modalidad" htmlFor="modality">
        <select id="modality" className="input" value={form.modality} onChange={set('modality')}>
          {(Object.keys(modalityLabel) as Modality[]).map((m) => (
            <option key={m} value={m}>
              {modalityLabel[m]}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="¿Cómo son tus clases?" htmlFor="desc" hint="Temas que dominás, metodología, disponibilidad horaria (20 a 1000 caracteres).">
          <textarea id="desc" required minLength={20} maxLength={1000} rows={4} className="input" value={form.description} onChange={set('description')} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field
          label={`Comprobante de aprobación ${isStudent ? '' : '(opcional para docentes)'}`}
          htmlFor="proof"
          hint={`Analítico o certificado de SYSACAD. PDF, JPG o PNG, máximo ${MAX_MB} MB. Solo lo ve la administración.`}
        >
          <input
            id="proof"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onDone}>
          Cancelar
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviar a revisión'}
        </button>
      </div>
    </form>
  );
}

export default function MyOfferings() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const offerings = useQuery({ queryKey: ['my-offerings'], queryFn: () => api<MyOffering[]>('/offerings/mine') });

  const toggle = useMutation({
    mutationFn: (o: MyOffering) =>
      api(`/offerings/${o.id}`, { method: 'PATCH', body: json({ status: o.status === 'APPROVED' ? 'PAUSED' : 'APPROVED' }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-offerings'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Dar clases</h1>
          <p className="text-sm text-slate-500">Publicá materias que ya aprobaste. Cada publicación la revisa la administración.</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Publicar materia
          </button>
        )}
      </div>

      {showForm && (
        <NewOfferingForm
          onDone={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ['my-offerings'] });
          }}
        />
      )}

      {toggle.isError && <Alert>{(toggle.error as Error).message}</Alert>}

      {offerings.isLoading ? (
        <Spinner />
      ) : offerings.data?.length === 0 ? (
        !showForm && <EmptyState title="Todavía no publicaste materias">Ayudá a otros estudiantes y generá ingresos.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {offerings.data?.map((o) => (
            <li key={o.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">
                  {o.subject.name}
                  {o.subject.plan && <span className="ml-1 text-xs font-normal text-slate-500">Plan {o.subject.plan.year}</span>}
                </p>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-sm text-slate-600">
                {money(o.pricePerHour)}/h · {modalityLabel[o.modality]} · {o._count.bookings} reserva(s)
              </p>
              {o.status === 'REJECTED' && o.reviewNote && (
                <Alert>
                  Motivo: {o.reviewNote}. Podés volver a publicarla con un comprobante correcto.
                </Alert>
              )}
              {o.status === 'PENDING_REVIEW' && <p className="text-sm text-amber-700">La administración está verificando tu comprobante.</p>}
              {(o.status === 'APPROVED' || o.status === 'PAUSED') && (
                <button className="btn-secondary" onClick={() => toggle.mutate(o)} disabled={toggle.isPending}>
                  {o.status === 'APPROVED' ? 'Pausar publicación' : 'Reactivar publicación'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
