import { useEffect, useRef, useState } from 'react';
import { RatingInput } from './StarRating';
import { Alert } from './ui';

interface Props {
  title: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export default function ReviewModal({ title, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  // <dialog> nativo: accesible, cierra con Escape y atrapa el foco
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const submit = async () => {
    if (!rating) return setError('Elegí una puntuación');
    setBusy(true);
    try {
      await onSubmit(rating, comment);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(95vw,28rem)] rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-bold text-brand-900">{title}</h2>
        {error && <Alert>{error}</Alert>}
        <RatingInput value={rating} onChange={setRating} />
        <div>
          <label htmlFor="comment" className="label">
            Comentario (opcional)
          </label>
          <textarea id="comment" rows={3} maxLength={500} className="input" value={comment} onChange={(e) => setComment(e.target.value)} />
          <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/500</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={() => dialog.current?.close()}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" disabled={busy} onClick={submit}>
            {busy ? 'Enviando…' : 'Enviar puntuación'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
