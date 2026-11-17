import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, json } from '../api/client';
import { useEmailDomains } from '../api/hooks';
import { Alert, Field } from '../components/ui';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const { hint } = useEmailDomains();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notVerified, setNotVerified] = useState(false);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setNotVerified(false);
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setNotVerified(err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      const r = await api<{ message: string }>('/auth/resend-verification', { method: 'POST', body: json({ email }) });
      setNotVerified(false);
      setInfo(r.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthShell title="Ingresar" subtitle={hint ? `Usá tu correo institucional (${hint}).` : undefined}>
      {error && <Alert>{error}</Alert>}
      {notVerified && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm">
          <p className="text-zinc-700">¿No te llegó el correo de verificación? Revisá también la carpeta de spam.</p>
          <button type="button" onClick={resend} className="mt-2 font-semibold text-brand-700 underline hover:text-brand-800">
            Reenviar correo de verificación
          </button>
        </div>
      )}
      {info && <Alert kind="success">{info}</Alert>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Correo institucional" htmlFor="email">
          <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4 text-center text-sm sm:flex-row sm:justify-between">
        <Link to="/olvide-mi-clave" className="text-zinc-600 hover:text-brand-700 hover:underline">
          Olvidé mi contraseña
        </Link>
        <Link to="/registro" className="font-semibold text-brand-700 hover:underline">
          Crear una cuenta
        </Link>
      </div>
    </AuthShell>
  );
}
