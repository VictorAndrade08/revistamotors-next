import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las URLs originales del sitio llevaban barra final (/articulo/).
  trailingSlash: true,
};

export default nextConfig;
