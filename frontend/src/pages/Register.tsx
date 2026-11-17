import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, json } from '../api/client';
import { useCareers } from '../api/hooks';
import { Alert, Field } from '../components/ui';

const rules = [
  { test: (p: string) => p.length >= 10, text: 'Al menos 10 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), text: 'Una mayúscula' },
  { test: (p: string) => /[a-z]/.test(p), text: 'Una minúscula' },
  { test: (p: string) => /\d/.test(p), text: 'Un número' },
];

export default function Register() {
  const careers = useCareers();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', legajo: '', careerId: '', password: '', confirm: '' });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const passwordOk = rules.every((r) => r.test(form.password));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
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
        <h1 className="text-2xl font-bold text-brand-900">¡Revisá tu correo!</h1>
        <p className="text-slate-600">{done}</p>
        <Link to="/ingresar" className="btn-primary">
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="card space-y-5 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Solo para la comunidad de la UTN FRT: usá tu correo institucional.</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="firstName">
            <input id="firstName" required minLength={2} maxLength={60} autoComplete="given-name" className="input" value={form.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Apellido" htmlFor="lastName">
            <input id="lastName" required minLength={2} maxLength={60} autoComplete="family-name" className="input" value={form.lastName} onChange={set('lastName')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Correo institucional" htmlFor="email">
              <input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={set('email')} />
            </Field>
          </div>
          <Field label="Legajo (opcional)" htmlFor="legajo">
            <input id="legajo" inputMode="numeric" pattern="[0-9]{4,10}" className="input" value={form.legajo} onChange={set('legajo')} />
          </Field>
          <Field label="Carrera" htmlFor="career">
            <select id="career" className="input" value={form.careerId} onChange={set('careerId')}>
              <option value="">Seleccioná…</option>
              {careers.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contraseña" htmlFor="password">
            <input id="password" type="password" required autoComplete="new-password" className="input" value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Repetir contraseña" htmlFor="confirm">
            <input id="confirm" type="password" required autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} />
          </Field>
          <ul className="grid grid-cols-2 gap-1 text-xs sm:col-span-2" aria-live="polite">
            {rules.map((r) => (
              <li key={r.text} className={r.test(form.password) ? 'text-emerald-700' : 'text-slate-500'}>
                {r.test(form.password) ? '✓' : '○'} {r.text}
              </li>
            ))}
          </ul>
          <label className="flex items-start gap-2 text-sm text-slate-600 sm:col-span-2">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            Acepto los términos de uso y la política de privacidad. Mis datos se usan solo para el funcionamiento de la plataforma
            (Ley 25.326 de Protección de Datos Personales).
          </label>
          <button className="btn-primary sm:col-span-2" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/ingresar" className="font-semibold text-brand-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}
