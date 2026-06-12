"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const SYNONYMS: string[][] = [
  ["auto", "autos", "carro", "carros", "coche", "coches", "automovil",
   "automoviles", "vehiculo", "vehiculos"],
  ["camion", "camiones", "truck", "trucks"],
  ["moto", "motos", "motocicleta", "motocicletas"],
  ["electrico", "electricos", "electrica", "ev"],
  ["llanta", "llantas", "neumatico", "neumaticos", "rueda", "ruedas"],
];

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
function expand(t: string): string[] {
  for (const g of SYNONYMS) if (g.includes(t)) return g;
  return [t];
}

function Filter() {
  const params = useSearchParams();
  const q = (params.get("s") ?? "").trim();

  useEffect(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(".p-wrap[data-find]"),
    );
    let visible = 0;
    for (const el of cards) {
      const hay = el.getAttribute("data-find") ?? "";
      const ok =
        !tokens.length ||
        tokens.every((t) => expand(t).some((s) => hay.includes(s)));
      el.style.display = ok ? "" : "none";
      if (ok) visible++;
    }
    // Actualizar título del archivo con el término y el conteo.
    const title = document.getElementById("rb-search-title");
    if (title) {
      title.textContent = q
        ? `“${q}” — ${visible} resultado${visible === 1 ? "" : "s"}`
        : "Todas las noticias";
    }
  }, [q]);

  return null;
}

export default function SearchFilter() {
  return (
    <Suspense fallback={null}>
      <Filter />
    </Suspense>
  );
}
