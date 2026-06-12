// El editor es un componente de cliente; este layout solo fija el runtime edge
// que exige Cloudflare Pages para las rutas dinámicas.
export const runtime = "edge";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
