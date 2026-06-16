// Sesión del admin: token firmado (HMAC-SHA256) con caducidad embebida.
// Reemplaza el antiguo "secreto estático en la cookie": ahora cada sesión
// lleva su propia firma y expira sola. Compatible con el runtime edge
// (usa Web Crypto, sin módulos de Node).

const enc = new TextEncoder();
const dec = new TextDecoder();

const SESSION_MS = 8 * 60 * 60 * 1000; // 8 horas

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 ? "=".repeat(4 - (norm.length % 4)) : "";
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Crea un token de sesión firmado, válido por SESSION_MS. */
export async function createToken(secret: string): Promise<string> {
  const payload = b64urlEncode(
    enc.encode(JSON.stringify({ exp: Date.now() + SESSION_MS })),
  );
  const key = await hmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(payload)),
  );
  return `${payload}.${b64urlEncode(sig)}`;
}

/** Verifica firma y caducidad. No lanza: devuelve false ante cualquier fallo. */
export async function verifyToken(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      enc.encode(payload),
    );
    if (!valid) return false;
    const { exp } = JSON.parse(dec.decode(b64urlDecode(payload)));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/** Comparación en tiempo constante (evita timing-attacks sobre la clave). */
export function safeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let r = 0;
  for (let i = 0; i < ab.length; i++) r |= ab[i] ^ bb[i];
  return r === 0;
}
