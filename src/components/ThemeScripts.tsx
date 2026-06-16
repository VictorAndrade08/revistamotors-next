"use client";

import { useEffect } from "react";
import type { ScriptEntry } from "@/site-data/loader";

/**
 * Reactiva en orden el JavaScript del tema original (jQuery, swiper del slider,
 * menús, sticky header…). React no ejecuta los <script> inyectados vía HTML, así
 * que aquí los recreamos secuencialmente: los externos se esperan a cargar y los
 * inline se ejecutan a continuación. Se re-ejecutan en cada navegación para que
 * el slider y los menús se inicialicen con el DOM de la página actual.
 */
export default function ThemeScripts({ scripts }: { scripts: ScriptEntry[] }) {
  useEffect(() => {
    let cancelled = false;
    const injected: HTMLScriptElement[] = [];

    function loadExternal(src: string): Promise<void> {
      return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.dataset.themeScript = "1";
        s.onload = () => resolve();
        s.onerror = () => resolve(); // no bloquear si un script falla
        document.body.appendChild(s);
        injected.push(s);
      });
    }

    function runInline(code: string) {
      const s = document.createElement("script");
      s.textContent = code;
      s.dataset.themeScript = "1";
      document.body.appendChild(s);
      injected.push(s);
    }

    (async () => {
      for (const entry of scripts) {
        if (cancelled) return;
        if (entry.src) {
          await loadExternal(entry.src);
        } else if (entry.code) {
          try {
            runInline(entry.code);
          } catch {
            /* ignora errores de un script puntual */
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      injected.forEach((s) => s.remove());
    };
  }, [scripts]);

  return null;
}
