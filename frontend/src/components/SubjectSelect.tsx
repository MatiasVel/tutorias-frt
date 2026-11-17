import type { Subject } from '../api/types';

const levelName = ['', '1er', '2do', '3er', '4to', '5to'];

/** Select de materias agrupadas por plan y nivel (<optgroup>), con las electivas marcadas. */
export default function SubjectSelect({
  id,
  subjects,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  subjects: Subject[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const groups = new Map<string, Subject[]>();
  for (const s of subjects) {
    const key = `${s.plan ? `Plan ${s.plan.year} · ` : ''}${levelName[s.year] ?? s.year} nivel`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return (
    <select id={id} aria-label="Materia" required={required} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {[...groups.entries()].map(([label, list]) => (
        <optgroup key={label} label={label}>
          {list.map((s) => (
            <option key={s.id} value={s.id}>
              {s.planCode ? `${s.planCode}. ` : ''}
              {s.name}
              {s.isElective ? ' (electiva)' : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
