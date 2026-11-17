import { useState, type FormEvent } from 'react';
import { api, json } from '../api/client';
import { Alert, Field } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: json({ email }) });
      setMsg(r.message);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-md card space-y-4 p-6 sm:p-8">
      <h1 className="section-title text-2xl">Recuperar contraseña</h1>
      {msg ? (
        <Alert kind="success">{msg}</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Correo institucional" htmlFor="email">
            <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button className="btn-primary w-full">Enviar instrucciones</button>
        </form>
      )}
    </div>
  );
}
