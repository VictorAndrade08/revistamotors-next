// Utilidades de texto compartidas (server y cliente).
// Centralizadas aquí para no repetir la misma normalización de acentos en
// el editor (slug) y el buscador (clave de búsqueda).

/** "Cámara Réflex 2024!" -> "camara-reflex-2024" (para URLs). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita los acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Clave normalizada para buscar (sin acentos ni signos, espacios simples). */
export function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Escapa texto para insertarlo en HTML de forma segura. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
