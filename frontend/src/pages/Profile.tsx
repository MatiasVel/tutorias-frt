import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, json } from '../api/client';
import { useCareers, usePlans } from '../api/hooks';
import { useAuth } from '../context/AuthContext';
import { RatingDisplay } from '../components/StarRating';
import { Alert, Field } from '../components/ui';

export default function Profile() {
  const { user, reloadUser } = useAuth();
  const careers = useCareers();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [careerId, setCareerId] = useState(user?.career?.id ? String(user.career.id) : '');
  const [studyPlanId, setStudyPlanId] = useState(user?.studyPlan?.id ? String(user.studyPlan.id) : '');
  const plans = usePlans(careerId ? Number(careerId) : undefined);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: json({
          phone: phone || undefined,
          bio,
          careerId: careerId ? Number(careerId) : undefined,
          studyPlanId: studyPlanId ? Number(studyPlanId) : undefined,
        }),
      });
      await reloadUser();
      setMsg({ ok: true, text: 'Perfil actualizado' });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl font-bold text-white ring-4 ring-brand-500">
          {user.firstName[0]}
          {user.lastName[0]}
        </div>
        <div>
          <p className="text-lg font-bold">
            {user.firstName} {user.lastName}
          </p>
          <p className="break-all text-sm text-zinc-500">{user.email}</p>
          {user.legajo && <p className="text-sm text-zinc-500">Legajo {user.legajo}</p>}
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Como tutor/a</p>
          <RatingDisplay avg={user.tutorRatingAvg} count={user.tutorRatingCount} />
          <p className="pt-2 font-semibold">Como alumno/a</p>
          <RatingDisplay avg={user.studentRatingAvg} count={user.studentRatingCount} />
        </div>
        <Link to={`/usuarios/${user.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
          Ver mi perfil público →
        </Link>
      </div>

      <form onSubmit={submit} className="card space-y-4 lg:col-span-2">
        <h1 className="text-xl font-bold text-ink">Mis datos</h1>
        {msg && <Alert kind={msg.ok ? 'success' : 'error'}>{msg.text}</Alert>}
        <Field label="Carrera" htmlFor="career">
          <select
            id="career"
            className="input"
            value={careerId}
            onChange={(e) => {
              setCareerId(e.target.value);
              setStudyPlanId('');
            }}
          >
            <option value="">Seleccioná…</option>
            {careers.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Plan de estudios" htmlFor="plan">
          <select id="plan" className="input" value={studyPlanId} onChange={(e) => setStudyPlanId(e.target.value)}>
            <option value="">Seleccioná…</option>
            {plans.map((pl) => (
              <option key={pl.id} value={pl.id}>
                Plan {pl.year}
                {pl.isCurrent ? ' (vigente)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Teléfono / WhatsApp" htmlFor="phone" hint="Solo se comparte cuando una clase está confirmada.">
          <input id="phone" type="tel" autoComplete="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Sobre mí" htmlFor="bio" hint="Se muestra en tu perfil público.">
          <textarea id="bio" rows={4} maxLength={600} className="input" value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <button className="btn-primary">Guardar cambios</button>
      </form>
    </div>
  );
}
