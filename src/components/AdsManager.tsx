"use client";

import { useEffect } from "react";

// Imagen en blanco (cuando el anuncio está desactivado).
const WHITE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect width='4' height='3' fill='%23ffffff'/%3E%3C/svg%3E";

type Ad = { original: string; imagen: string | null; activo: boolean };

function fileName(p: string) {
  return p.split("/").pop() ?? p;
}

export default function AdsManager() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/anuncios")
      .then((r) => (r.ok ? r.json() : []))
      .then((ads: Ad[]) => {
        if (cancelled) return;
        for (const ad of ads) {
          const key = fileName(ad.original);
          const src = ad.activo ? ad.imagen || ad.original : WHITE;

          // <img> cuyo src contiene el nombre del banner original
          document.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
            if (img.getAttribute("src")?.includes(key)) {
              img.src = src;
              img.style.background = ad.activo ? "" : "#fff";
            }
          });

          // Fondos (background-image) que referencian el banner
          document
            .querySelectorAll<HTMLElement>(`[style*="${key}"]`)
            .forEach((el) => {
              el.style.backgroundImage = ad.activo
                ? `url("${ad.imagen || ad.original}")`
                : "none";
              if (!ad.activo) el.style.backgroundColor = "#fff";
            });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
