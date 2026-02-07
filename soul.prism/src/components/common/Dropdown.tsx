'use client';

interface DropdownProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}

export default function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: DropdownProps<T>) {
  return (
    <label className="flex items-center gap-1 text-sm">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
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