import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Field } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-5 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-brand-900">Ingresar</h1>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Correo institucional" htmlFor="email">
            <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Contraseña" htmlFor="password">
            <input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <div className="flex flex-col gap-2 text-center text-sm sm:flex-row sm:justify-between">
          <Link to="/olvide-mi-clave" className="text-brand-700 hover:underline">
            Olvidé mi contraseña
          </Link>
          <Link to="/registro" className="font-semibold text-brand-700 hover:underline">
            Crear una cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
