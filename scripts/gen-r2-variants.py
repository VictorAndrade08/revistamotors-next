#!/usr/bin/env python3
"""Genera variantes de 800px para las portadas del blog en R2.

Para cada `revistamottros/blog/web-*.webp` crea `web-*-800.webp` (si no
existe). El sitio las usa en el srcset de las tarjetas (ver db-loader.ts:
srcsetPortada), así las cuadrículas no descargan la imagen de 1536px.
Ejecutar tras publicar noticias con imágenes nuevas.
"""
import io
from pathlib import Path
import boto3
from botocore.config import Config
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PREFIX = "revistamottros/blog/"


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
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
    config=Config(signature_version="s3v4", region_name="auto"),
)
BUCKET = E["R2_BUCKET_NAME"]


def main():
    keys = []
    token = None
    while True:
        kw = {"Bucket": BUCKET, "Prefix": PREFIX}
        if token:
            kw["ContinuationToken"] = token
        resp = s3.list_objects_v2(**kw)
        keys += [o["Key"] for o in resp.get("Contents", [])]
        if not resp.get("IsTruncated"):
            break
        token = resp["NextContinuationToken"]

    existing = set(keys)
    originals = [k for k in keys if k.endswith(".webp") and not k.endswith("-800.webp")]
    print(f"{len(originals)} portadas en {PREFIX}")

    for k in originals:
        variant = k[: -len(".webp")] + "-800.webp"
        if variant in existing:
            print(f"  ya existe {variant}")
            continue
        data = s3.get_object(Bucket=BUCKET, Key=k)["Body"].read()
        im = Image.open(io.BytesIO(data)).convert("RGB")
        if im.width > 800:
            im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format="WEBP", quality=80, method=6)
        s3.put_object(
            Bucket=BUCKET, Key=variant, Body=buf.getvalue(), ContentType="image/webp",
            CacheControl="public, max-age=31536000, immutable",
        )
        print(f"  creada {variant}  ({buf.tell() // 1024} KB)")


if __name__ == "__main__":
    main()
