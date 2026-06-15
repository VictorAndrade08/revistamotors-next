#!/usr/bin/env python3
"""
Convierte las imágenes de public/assets a .webp y las sube a Cloudflare R2
bajo el prefijo "revista motors/", preservando la estructura de carpetas.

- jpg/jpeg/png  -> se convierten a .webp
- webp          -> se suben tal cual
- svg           -> se suben tal cual (vector, no se rasteriza)

Lee credenciales de .env.local (R2_*). Genálo con concurrencia.
"""
import os, io, sys, mimetypes, json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
from botocore.config import Config
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "public" / "assets"
PREFIX = "revistamottros/"          # carpeta destino dentro del bucket
MANIFEST = ROOT / "scripts" / "r2-manifest.json"

# --- credenciales desde .env.local ---
def load_env():
    env = {}
    p = ROOT / ".env.local"
    for line in p.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env

E = load_env()
s3 = boto3.client(
    "s3",
    endpoint_url=E["R2_ENDPOINT"],
    aws_access_key_id=E["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=E["R2_SECRET_ACCESS_KEY"],
    config=Config(signature_version="s3v4", region_name="auto", max_pool_connections=32),
)
BUCKET = E["R2_BUCKET_NAME"]

RASTER = {".jpg", ".jpeg", ".png"}
KEEP = {".webp", ".svg"}

def to_webp_bytes(path: Path) -> bytes:
    im = Image.open(path)
    # Preservar transparencia (RGBA) o convertir a RGB.
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        q = 90
    else:
        im = im.convert("RGB")
        q = 82
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=q, method=6)
    return buf.getvalue()

def process(path: Path):
    rel = path.relative_to(ROOT / "public")          # assets/uploads/.../x.png
    ext = path.suffix.lower()
    try:
        if ext in RASTER:
            data = to_webp_bytes(path)
            key = PREFIX + str(rel.with_suffix(".webp"))
            ctype = "image/webp"
            orig = "/" + str(rel)
            newrel = str(rel.with_suffix(".webp"))
        elif ext in KEEP:
            data = path.read_bytes()
            key = PREFIX + str(rel)
            ctype = "image/webp" if ext == ".webp" else "image/svg+xml"
            orig = "/" + str(rel)
            newrel = str(rel)
        else:
            return None  # no es imagen
        s3.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType=ctype)
        return {"original": orig, "key": key, "newrel": "/" + newrel, "bytes": len(data)}
    except Exception as ex:
        print(f"  [ERROR] {rel}: {ex}", file=sys.stderr)
        return {"error": str(ex), "path": str(rel)}

def main():
    img_ext = RASTER | KEEP
    files = [p for p in ASSETS.rglob("*") if p.is_file() and p.suffix.lower() in img_ext]
    print(f"Imágenes a procesar: {len(files)}  ->  bucket '{BUCKET}', prefijo '{PREFIX}'")
    ok, manifest = 0, []
    with ThreadPoolExecutor(max_workers=24) as ex:
        futs = {ex.submit(process, p): p for p in files}
        for i, fut in enumerate(as_completed(futs), 1):
            r = fut.result()
            if r and "error" not in r:
                ok += 1; manifest.append(r)
            if i % 50 == 0 or i == len(files):
                print(f"  {i}/{len(files)} subidas…")
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f"\nListo: {ok}/{len(files)} subidas. Manifiesto: {MANIFEST.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
