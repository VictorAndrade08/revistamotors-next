"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RichEditor from "@/components/admin/RichEditor";
import TagPicker from "@/components/admin/TagPicker";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const raw = (params.slug as string[] | undefined)?.[0];
  const isNew = !raw || raw === "nuevo";

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fecha, setFecha] = useState("");
  const [portada, setPortada] = useState("");
  const [extracto, setExtracto] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [catOptions, setCatOptions] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [html, setHtml] = useState("");
  const [ready, setReady] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  // Cargar categorías y etiquetas existentes para elegir.
  useEffect(() => {
    fetch("/api/admin/taxonomias", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { categorias: [], tags: [] }))
      .then((d) => {
        setCatOptions(d.categorias ?? []);
        setTagOptions(d.tags ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) {
      setFecha(new Date().toISOString());
      return;
    }
    (async () => {
      const res = await fetch(`/api/admin/articulos/${raw}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const a = await res.json();
        setTitulo(a.titulo ?? "");
        setSlug(a.slug ?? "");
        setSlugTouched(true);
        setFecha(a.fecha ?? new Date().toISOString());
        setPortada(a.portada ?? "");
        setExtracto(a.extracto ?? "");
        setCategorias(JSON.parse(a.categorias || "[]") as string[]);
        setTags(JSON.parse(a.tags || "[]") as string[]);
        setHtml(a.html ?? "");
      }
      setReady(true);
    })();
  }, [isNew, raw]);

  function onTitulo(v: string) {
    setTitulo(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setPortada(data.url);
    e.target.value = "";
  }

  async function save() {
    if (!titulo || !slug) {
      alert("El título y el slug son obligatorios.");
      return;
    }
    setSaving(true);
    const body = {
      slug,
      titulo,
      fecha,
      portada,
      extracto,
      html,
      categorias,
      tags,
    };
    const res = await fetch("/api/admin/articulos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) router.push("/admin");
    else alert("Error al guardar: " + (await res.json()).error);
  }

  if (!ready) {
    return <p className="p-20 text-center text-gray-400">Cargando…</p>;
  }

  const inputCls =
    "w-full rounded-xl border border-gray-300 px-3.5 py-2 text-[14px] outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/20";

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
          <span className="font-bold text-[#0e1116]">
            {isNew ? "Nueva noticia" : "Editar noticia"}
          </span>
          <div className="flex items-center gap-2">
            {!isNew && slug && (
              <a
                href={`/${slug}/`}
                target="_blank"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Ver ↗
              </a>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-[#ed1c24] px-6 py-2.5 font-bold text-white transition-colors hover:bg-[#b3141a] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_300px]">
        {/* Columna principal */}
        <div className="space-y-5">
          <input
            value={titulo}
            onChange={(e) => onTitulo(e.target.value)}
            placeholder="Título de la noticia"
            className="w-full bg-transparent text-3xl font-extrabold text-[#0e1116] outline-none placeholder:text-gray-300"
          />
          <RichEditor value={html} onChange={setHtml} />
        </div>

        {/* Barra lateral */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
              Portada
            </h3>
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portada}
                alt=""
                className="mb-3 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
                Sin imagen
              </div>
            )}
            <button
              onClick={() => coverRef.current?.click()}
              className="w-full rounded-lg bg-gray-100 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Subir portada
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              hidden
              onChange={uploadCover}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Slug (URL)
              </label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                className={inputCls}
              />
              {!isNew && slug && (
                <a
                  href={`/${slug}/`}
                  target="_blank"
                  className="mt-1.5 inline-block text-xs font-semibold text-[#ed1c24] hover:underline"
                >
                  → Ver la noticia en el sitio
                </a>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Fecha
              </label>
              <input
                type="datetime-local"
                value={fecha ? fecha.slice(0, 16) : ""}
                onChange={(e) =>
                  setFecha(new Date(e.target.value).toISOString())
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                Categorías
              </label>
              <TagPicker
                value={categorias}
                options={catOptions}
                onChange={setCategorias}
                placeholder="Añadir categoría…"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                Etiquetas
              </label>
              <TagPicker
                value={tags}
                options={tagOptions}
                onChange={setTags}
                placeholder="Añadir etiqueta…"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Extracto
              </label>
              <textarea
                value={extracto}
                onChange={(e) => setExtracto(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
