import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, json } from '../api/client';
import { Alert, Field } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    try {
      const r = await api<{ message: string }>('/auth/reset-password', { method: 'POST', body: json({ token, password }) });
      setMsg(r.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-md card space-y-4 p-6 sm:p-8">
      <h1 className="section-title text-2xl">Nueva contraseña</h1>
      {msg ? (
        <>
          <Alert kind="success">{msg}</Alert>
          <Link to="/ingresar" className="btn-primary w-full">
            Ingresar
          </Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Nueva contraseña" htmlFor="pw" hint="Mínimo 10 caracteres, con mayúscula, minúscula y número.">
            <input id="pw" type="password" autoComplete="new-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Repetir contraseña" htmlFor="pw2">
            <input id="pw2" type="password" autoComplete="new-password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <button className="btn-primary w-full">Guardar</button>
        </form>
      )}
    </div>
  );
}
