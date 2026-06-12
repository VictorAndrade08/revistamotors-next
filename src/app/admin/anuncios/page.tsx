"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Ad = {
  id: string;
  ubicacion: string;
  descripcion: string;
  path: string;
  ancho: number;
  alto: number;
  imagen: string | null;
  activo: boolean;
};

export default function AnunciosPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [bust, setBust] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/anuncios", { cache: "no-store" });
    setAds(res.ok ? await res.json() : []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function update(id: string, patch: Partial<Ad>) {
    await fetch("/api/admin/anuncios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setBust(Date.now());
    load();
  }

  async function changeImage(
    ad: Ad,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) update(ad.id, { imagen: data.url });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            ← Volver
          </button>
          <span className="font-bold text-[#0e1116]">Anuncios</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-6 text-sm text-gray-500">
          Cambia la imagen de cada banner o desactívalo (saldrá en blanco).
        </p>

        {loading ? (
          <p className="py-20 text-center text-gray-400">Cargando…</p>
        ) : (
          <div className="space-y-5">
            {ads.map((ad) => {
              const current = (ad.imagen || ad.path) + `?t=${bust}`;
              return (
                <div
                  key={ad.id}
                  className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row"
                >
                  <div className="flex w-full max-w-[260px] items-center justify-center rounded-xl bg-gray-100 p-2">
                    {ad.activo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={current}
                        alt=""
                        onError={(e) => (e.currentTarget.src = "/icon.webp")}
                        className="max-h-40 w-full rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white text-sm text-gray-400">
                        Desactivado (en blanco)
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <h3 className="text-lg font-extrabold text-[#0e1116]">
                      {ad.ubicacion}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {ad.descripcion}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Tamaño recomendado: {ad.ancho}×{ad.alto}px
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      <button
                        onClick={() => fileRefs.current[ad.id]?.click()}
                        className="rounded-lg bg-[#ed1c24] px-4 py-2 text-sm font-bold text-white hover:bg-[#b3141a]"
                      >
                        Cambiar imagen
                      </button>
                      <input
                        ref={(el) => {
                          fileRefs.current[ad.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => changeImage(ad, e)}
                      />
                      <button
                        onClick={() => update(ad.id, { activo: !ad.activo })}
                        className={`rounded-lg px-4 py-2 text-sm font-bold ${
                          ad.activo
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {ad.activo ? "Desactivar" : "Activar"}
                      </button>
                      {ad.imagen && (
                        <button
                          onClick={() => update(ad.id, { imagen: null })}
                          className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                        >
                          Restaurar original
                        </button>
                      )}
                      <span
                        className={`ml-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          ad.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {ad.activo ? "● Activo" : "○ Desactivado"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
