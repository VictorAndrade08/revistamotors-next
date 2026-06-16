import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las URLs originales del sitio llevaban barra final (/articulo/).
  trailingSlash: true,
  async headers() {
    return [
      // Admin y sus APIs: nunca cachear.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      // Páginas públicas: el navegador revalida siempre (nunca sirve una versión
      // vieja), pero el CDN cachea unos segundos (rápido). Así, al publicar una
      // noticia aparece casi al instante y sin "contenido viejo" en el navegador.
      {
        source: "/((?!_next|assets|api|admin).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=30, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

// En desarrollo, expone los bindings de Cloudflare (DB) dentro de `next dev`.
if (process.env.NODE_ENV === "development") {
  import("@cloudflare/next-on-pages/next-dev")
    .then(({ setupDevPlatform }) => setupDevPlatform())
    .catch(() => {});
}

export default nextConfig;
