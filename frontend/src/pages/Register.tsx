import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, json } from '../api/client';
import { useCareers, useEmailDomains, usePlans } from '../api/hooks';
import { Alert, Field } from '../components/ui';
import AuthShell from '../components/AuthShell';

const rules = [
  { test: (p: string) => p.length >= 10, text: 'Al menos 10 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), text: 'Una mayúscula' },
  { test: (p: string) => /[a-z]/.test(p), text: 'Una minúscula' },
  { test: (p: string) => /\d/.test(p), text: 'Un número' },
];

export default function Register() {
  const careers = useCareers();
  const { isAllowed, hint } = useEmailDomains();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', legajo: '', careerId: '', studyPlanId: '', password: '', confirm: '' });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const plans = usePlans(form.careerId ? Number(form.careerId) : undefined);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const passwordOk = rules.every((r) => r.test(form.password));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isAllowed(form.email)) return setError(`Usá tu correo institucional (${hint})`);
    if (!passwordOk) return setError('La contraseña no cumple los requisitos');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    if (!accept) return setError('Tenés que aceptar los términos de uso');
    setBusy(true);
    try {
      const res = await api<{ message: string }>('/auth/register', {
        method: 'POST',
        body: json({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          legajo: form.legajo || undefined,
          careerId: form.careerId ? Number(form.careerId) : undefined,
          studyPlanId: form.studyPlanId ? Number(form.studyPlanId) : undefined,
        }),
      });
      setDone(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md card space-y-4 p-8 text-center">
        <h1 className="section-title text-2xl">¡Revisá tu correo!</h1>
        <p className="text-zinc-600">{done}</p>
        <Link to="/ingresar" className="btn-primary">
          Ir a ingresar
        </Link>
      </div>
    );
  }

  const emailInvalid = form.email.includes('@') && !isAllowed(form.email);

  return (
    <AuthShell title="Crear cuenta" subtitle={`Solo para la comunidad de la UTN FRT. Usá tu correo institucional${hint ? ` (${hint})` : ''}.`}>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="firstName">
            <input id="firstName" required minLength={2} maxLength={60} autoComplete="given-name" className="input" value={form.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Apellido" htmlFor="lastName">
            <input id="lastName" required minLength={2} maxLength={60} autoComplete="family-name" className="input" value={form.lastName} onChange={set('lastName')} />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Correo institucional"
              htmlFor="email"
              hint={hint ? `Se aceptan: ${hint}` : undefined}
            >
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                aria-invalid={emailInvalid}
                className={`input ${emailInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                value={form.email}
                onChange={set('email')}
              />
              {emailInvalid && <p className="mt-1 text-xs font-semibold text-red-700">Ese dominio no está permitido.</p>}
            </Field>
          </div>
          <Field label="Legajo (opcional)" htmlFor="legajo">
            <input id="legajo" inputMode="numeric" pattern="[0-9]{4,10}" className="input" value={form.legajo} onChange={set('legajo')} />
          </Field>
          <Field label="Carrera" htmlFor="career">
            <select id="career" className="input" value={form.careerId} onChange={(e) => setForm({ ...form, careerId: e.target.value, studyPlanId: '' })}>
              <option value="">Seleccioná…</option>
              {careers.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {form.careerId && plans.length > 0 && (
            <div className="sm:col-span-2">
              <Field label="Plan de estudios" htmlFor="plan">
                <select id="plan" className="input" value={form.studyPlanId} onChange={set('studyPlanId')}>
                  <option value="">Seleccioná…</option>
                  {plans.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      Plan {pl.year}
                      {pl.isCurrent ? ' (vigente)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          <Field label="Contraseña" htmlFor="password">
            <input id="password" type="password" required autoComplete="new-password" className="input" value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Repetir contraseña" htmlFor="confirm">
            <input id="confirm" type="password" required autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} />
          </Field>
          <ul className="grid grid-cols-2 gap-1 text-xs sm:col-span-2" aria-live="polite">
            {rules.map((r) => (
              <li key={r.text} className={r.test(form.password) ? 'text-emerald-700' : 'text-zinc-500'}>
                {r.test(form.password) ? '✓' : '○'} {r.text}
              </li>
            ))}
          </ul>
          <label className="flex items-start gap-2 text-sm text-zinc-600 sm:col-span-2">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            Acepto los términos de uso y la política de privacidad. Mis datos se usan solo para el funcionamiento de la plataforma
            (Ley 25.326 de Protección de Datos Personales).
          </label>
          <button className="btn-primary sm:col-span-2" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/ingresar" className="font-semibold text-brand-700 hover:underline">
            Ingresá
          </Link>
        </p>
    </AuthShell>
  );
}
