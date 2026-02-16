"use client";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface DropdownProps<T extends string> {
  label: string;
  value: T;
  options: readonly Option<T>[];
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
          <option
            key={opt.value}
            value={opt.value}
            className="border-b bg-[var(--bg-secondary)]"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
