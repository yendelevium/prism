'use client';

export default function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-sm">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 border-[var(--border-color)] rounded-md bg-[var(--accent)] text-black text-sm"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="border-b bg-[var(--bg-secondary)]">
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}