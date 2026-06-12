"use client";

import { useState } from "react";

/**
 * Selector de chips: muestra los seleccionados, permite quitar, escribir
 * nuevos (Enter) y elegir de los existentes (sugerencias clicables).
 */
export default function TagPicker({
  value,
  options,
  onChange,
  placeholder = "Añadir…",
}: {
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function add(tag: string) {
    const t = tag.trim();
    if (!t) return;
    if (!value.some((v) => v.toLowerCase() === t.toLowerCase())) {
      onChange([...value, t]);
    }
    setInput("");
  }
  function remove(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  const suggestions = options.filter(
    (o) => !value.some((v) => v.toLowerCase() === o.toLowerCase()),
  );

  return (
    <div>
      {/* Seleccionados + input */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-300 p-2 focus-within:border-[#ed1c24] focus-within:ring-2 focus-within:ring-[#ed1c24]/20">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[#ed1c24] px-2.5 py-1 text-sm font-semibold text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-0.5 text-white/80 hover:text-white"
              aria-label={`Quitar ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            } else if (e.key === "Backspace" && !input && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={placeholder}
          className="min-w-[100px] flex-1 px-1 py-1 text-sm outline-none"
        />
      </div>

      {/* Sugerencias existentes */}
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => add(o)}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              + {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
