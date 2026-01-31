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
        className="bg-transparent border border-[var(--border-color)] rounded px-2 py-1"
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