"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = { slug: string; titulo: string; fecha: string; portada: string };

export default function AdminHome() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/articulos", { cache: "no-store" });
    setRows(res.ok ? await res.json() : []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function remove(slug: string) {
    if (!confirm("¿Eliminar esta noticia? No se puede deshacer.")) return;
    await fetch(`/api/admin/articulos/${slug}`, { method: "DELETE" });
    load();
  }

  async function duplicate(slug: string) {
    const res = await fetch(`/api/admin/articulos/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const a = await res.json();
    const suffix = Math.random().toString(36).slice(2, 6);
    const body = {
      slug: `${a.slug}-copia-${suffix}`,
      titulo: `${a.titulo} (copia)`,
      fecha: a.fecha,
      portada: a.portada,
      extracto: a.extracto,
      html: a.html,
      categorias: JSON.parse(a.categorias || "[]"),
      tags: JSON.parse(a.tags || "[]"),
    };
    await fetch("/api/admin/articulos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra superior */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.webp" alt="" className="h-8 w-8" />
            <span className="text-lg font-extrabold text-[#0e1116]">
              Panel de Noticias
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/anuncios"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Anuncios
            </Link>
            <a
              href="/"
              target="_blank"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Ver sitio ↗
            </a>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0e1116]">Noticias</h1>
            <p className="text-sm text-gray-500">
              {rows.length} publicada{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/admin/editor/nuevo"
            className="rounded-xl bg-[#ed1c24] px-5 py-2.5 font-bold text-white transition-colors hover:bg-[#b3141a]"
          >
            + Nueva noticia
          </Link>
        </div>

        {loading ? (
          <p className="py-20 text-center text-gray-400">Cargando…</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.slug}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-3"
              >
                {/* Click en la imagen o el título -> ver el post en el sitio */}
                <a
                  href={`/${r.slug}/`}
                  target="_blank"
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.portada || "/icon.webp"}
                    alt=""
                    onError={(e) => (e.currentTarget.src = "/icon.webp")}
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-[#0e1116] hover:text-[#ed1c24]">
                      {r.titulo}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {r.fecha?.slice(0, 10)} · /{r.slug}
                    </p>
                  </div>
                </a>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/editor/${r.slug}`}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => duplicate(r.slug)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Duplicar
                  </button>
                  <button
                    onClick={() => remove(r.slug)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[#ed1c24] hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
