import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuración del adaptador OpenNext para Cloudflare Workers.
// Sin caché incremental externa (R2): se puede añadir más adelante si hace falta.
export default defineCloudflareConfig();
