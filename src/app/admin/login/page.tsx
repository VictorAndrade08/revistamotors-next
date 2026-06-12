"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Campo de texto: borde fino, foco suave (sin anillo grueso).
const inputCls =
  "block w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 " +
  "px-4 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-300 " +
  "shadow-none outline-none ring-0 transition-all duration-150 " +
  "focus:border-[#ed1c24]/70 focus:bg-white " +
  "focus:shadow-[0_0_0_4px_rgba(237,28,36,0.08)] focus:ring-0";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass }),
    });
    setLoading(false);
    if (res.ok) router.push("/admin");
    else setError((await res.json()).error ?? "Error");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0e1116] px-4">
      {/* Glow de marca de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#ed1c24]/20 blur-[120px]"
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-black/5"
      >
        {/* Acento superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ed1c24] to-[#ff5a4d]" />

        <div className="p-8">
          <div className="mb-7 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0e1116] shadow-lg ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.webp" alt="Revista Motors" className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0e1116]">
                Panel de Noticias
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">Revista Motors</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-[#ed1c24]">
              {error}
            </div>
          )}

          <label
            htmlFor="login-user"
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            Usuario
          </label>
          <input
            id="login-user"
            name="username"
            autoComplete="username"
            placeholder="admin"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className={inputCls + " mb-4"}
            autoFocus
          />

          <label
            htmlFor="login-pass"
            className="mb-1.5 block text-sm font-semibold text-gray-700"
          >
            Clave
          </label>
          <input
            id="login-pass"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className={inputCls + " mb-6"}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#ed1c24] py-3 font-bold text-white shadow-lg shadow-[#ed1c24]/25 transition-all hover:bg-[#b3141a] hover:shadow-[#ed1c24]/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </div>
      </form>
    </div>
  );
}
