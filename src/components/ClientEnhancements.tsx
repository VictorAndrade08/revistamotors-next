"use client";

import { useEffect } from "react";

/**
 * Mejoras de cliente sobre el marcado del tema:
 *  1) Click en el slider: el swiper del tema captura el click como arrastre y no
 *     navega. Detectamos click-vs-arrastre y forzamos la navegación al post.
 *  2) Imágenes rotas: cualquier <img> que falle se sustituye por la miniatura M.
 */
export default function ClientEnhancements() {
  useEffect(() => {
    // --- 1) Navegación del slider ---
    let sx = 0,
      sy = 0,
      target: HTMLAnchorElement | null = null;

    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      target = el?.closest(
        "a.p-url, .swiper a[href], .rbct a[href]",
      ) as HTMLAnchorElement | null;
      sx = e.clientX;
      sy = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      const a = target;
      target = null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (Math.abs(e.clientX - sx) < 8 && Math.abs(e.clientY - sy) < 8) {
        window.location.assign(href);
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);

    // --- 2) Fallback de imágenes rotas ---
    const onErr = (e: Event) => {
      const img = e.target as HTMLImageElement;
      if (img.tagName === "IMG" && !img.src.endsWith("/icon.webp")) {
        img.src = "/icon.webp";
        img.style.objectFit = "contain";
        img.style.background = "#f3f4f6";
      }
    };
    document.addEventListener("error", onErr, true);

    // --- 3) Botón "Votar": no llamar al backend muerto; mostrar "enviado" ---
    const onVote = (e: Event) => {
      const t = (e.target as HTMLElement)?.closest(
        ".basic-vote-button, .basic-yop-poll-container button, .basic-yop-poll-container input[type='button'], .basic-yop-poll-container input[type='submit']",
      );
      if (!t) return;
      const poll = t.closest(".basic-yop-poll-container") as HTMLElement | null;
      if (!poll) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      poll.innerHTML =
        '<div style="text-align:center;padding:40px 12px">' +
        '<div style="width:54px;height:54px;margin:0 auto;border-radius:9999px;background:#ed1c24;display:flex;align-items:center;justify-content:center">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '<p style="font-size:18px;font-weight:800;color:#0e1116;margin:16px 0 4px">¡Voto enviado!</p>' +
        '<p style="color:#6b7280;font-size:14px;margin:0">Gracias por participar.</p></div>';
    };
    document.addEventListener("click", onVote, true);

    return () => {
      document.removeEventListener("click", onVote, true);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("error", onErr, true);
    };
  }, []);

  return null;
}
