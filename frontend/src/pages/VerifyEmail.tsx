import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, json } from '../api/client';
import { Alert, Spinner } from '../components/ui';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const sent = useRef(false); // evita doble envío en StrictMode

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    api<{ message: string }>('/auth/verify-email', { method: 'POST', body: json({ token }) })
      .then((r) => setState({ ok: true, msg: r.message }))
      .catch((e) => setState({ ok: false, msg: (e as Error).message }));
  }, [token]);

  if (!token) return <Alert>Enlace inválido.</Alert>;
  if (!state) return <Spinner />;
  return (
    <div className="mx-auto max-w-md card space-y-4 p-8 text-center">
      <Alert kind={state.ok ? 'success' : 'error'}>{state.msg}</Alert>
      <Link to="/ingresar" className="btn-primary">
        Ir a ingresar
      </Link>
    </div>
  );
}
