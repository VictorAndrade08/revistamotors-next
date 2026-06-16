// Configuración del panel de administración (solo se usa en server/middleware).
// Los secretos se leen de variables de entorno (.env.local), nunca se versionan.
// Ver .env.example para la lista de variables requeridas.
export const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
export const ADMIN_PASS = process.env.ADMIN_PASS ?? "";
// Secreto con el que se firma el token de sesión (ver lib/session.ts).
export const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
export const ADMIN_COOKIE = "rm_admin";

// Fail-closed: el panel solo funciona si los secretos están bien configurados.
// Sin esto, un despliegue sin variables de entorno aceptaría clave vacía.
export function adminConfigOk(): boolean {
  return ADMIN_PASS.length > 0 && ADMIN_SECRET.length >= 16;
}
