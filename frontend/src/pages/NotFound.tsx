import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-900">404</p>
      <p className="mt-2 text-slate-600">La página que buscás no existe.</p>
      <Link to="/" className="btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}
