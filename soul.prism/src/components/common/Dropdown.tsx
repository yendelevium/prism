"use client";

import { useEffect, useRef } from "react";

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
  const ref = useRef<HTMLSelectElement>(null);

  const resize = () => {
    const select = ref.current;
    if (!select) return;

    const temp = document.createElement("span");
    const styles = getComputedStyle(select);

    temp.style.visibility = "hidden";
    temp.style.position = "absolute";
    temp.style.whiteSpace = "nowrap";
    temp.style.font = styles.font;

    temp.textContent = select.options[select.selectedIndex].text;

    document.body.appendChild(temp);
    select.style.width = temp.offsetWidth + 30 + "px";
    document.body.removeChild(temp);
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <label className="flex items-center gap-1 text-sm">
      <select
        ref={ref}
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
