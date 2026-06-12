"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex min-h-screen items-center justify-center bg-[#0e1116] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.webp" alt="Revista Motors" className="h-14 w-14" />
          <h1 className="text-xl font-extrabold text-[#0e1116]">
            Panel de Noticias
          </h1>
          <p className="text-sm text-gray-500">Revista Motors</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-[#ed1c24]">
            {error}
          </div>
        )}

        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Usuario
        </label>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/20"
          autoFocus
        />

        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Clave
        </label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="mb-6 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/20"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#ed1c24] py-3 font-bold text-white transition-colors hover:bg-[#b3141a] disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
