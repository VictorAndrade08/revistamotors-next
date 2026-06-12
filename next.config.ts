import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las URLs originales del sitio llevaban barra final (/articulo/).
  trailingSlash: true,
};

// En desarrollo, expone los bindings de Cloudflare (DB) dentro de `next dev`.
if (process.env.NODE_ENV === "development") {
  import("@cloudflare/next-on-pages/next-dev")
    .then(({ setupDevPlatform }) => setupDevPlatform())
    .catch(() => {});
}

export default nextConfig;
