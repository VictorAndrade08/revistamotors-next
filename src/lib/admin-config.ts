// Configuración del panel de administración (solo se usa en server/middleware).
// Los secretos se leen de variables de entorno (.env.local), nunca se versionan.
// Ver .env.example para la lista de variables requeridas.
export const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
export const ADMIN_PASS = process.env.ADMIN_PASS ?? "";
// Valor que se guarda en la cookie de sesión tras iniciar sesión.
export const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
export const ADMIN_COOKIE = "rm_admin";
