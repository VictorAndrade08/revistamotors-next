import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Sitio de contenido estático (sin revalidación/ISR): las páginas
// pre-renderizadas se sirven desde los assets estáticos del Worker.
// No necesita R2/KV y se mantiene dentro del plan gratuito.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
