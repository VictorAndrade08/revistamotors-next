import Link from "next/link";

// 404 útil: en lugar de una página vacía, ofrece volver al inicio o buscar.
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ fontSize: 72, fontWeight: 800, color: "#ed1c24", margin: 0 }}>
        404
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0e1116", margin: "8px 0 6px" }}>
        Esta página no existe
      </h1>
      <p style={{ color: "#6b7280", margin: "0 0 24px" }}>
        Puede que la noticia se haya movido o que el enlace esté mal escrito.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            background: "#ed1c24",
            color: "#fff",
            fontWeight: 800,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Ir a la portada
        </Link>
        <Link
          href="/buscar/"
          style={{
            background: "#0e1116",
            color: "#fff",
            fontWeight: 800,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Buscar noticias
        </Link>
      </div>
    </div>
  );
}
