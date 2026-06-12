# Revista Motors Ecuador

Sitio web de la revista de automóviles **Revista Motors Ecuador**, recreado en **Next.js 16** + **React 19** a partir del sitio original en WordPress (tema Foxiz + Elementor).

## Arquitectura

- **Sitio público** — Las páginas del sitio están guardadas como instantáneas JSON en [`src/site-data/pages/`](src/site-data/pages/) y se sirven mediante una ruta *catch-all* ([`src/app/[[...slug]]/page.tsx`](src/app/%5B%5B...slug%5D%5D/page.tsx)). El enrutado se resuelve con [`src/site-data/routes.json`](src/site-data/routes.json) y el cargador [`src/site-data/loader.ts`](src/site-data/loader.ts).
- **Buscador** — [`src/app/buscar/`](src/app/buscar/), con índice precalculado en `src/site-data/search-index.json`.
- **Anuncios** — Gestor de publicidad en [`src/components/AdsManager.tsx`](src/components/AdsManager.tsx) y la API [`src/app/api/anuncios/`](src/app/api/anuncios/).
- **Panel de administración** (`/admin`) — Editor de artículos con [TipTap](https://tiptap.dev), protegido por [`src/middleware.ts`](src/middleware.ts). Permite crear/editar artículos, gestionar taxonomías y anuncios, y subir imágenes.
- **Base de datos** — Cloudflare **D1** (base `motros`), accedida vía API REST de Cloudflare con respaldo al CLI de Wrangler ([`src/lib/d1.ts`](src/lib/d1.ts)). Esquema en [`db/schema.sql`](db/schema.sql).
- **Despliegue** — Cloudflare (ver [`wrangler.jsonc`](wrangler.jsonc)).

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
#    edita .env.local con tus valores reales (Cloudflare + credenciales admin)

# 3. Servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El panel de administración está en [http://localhost:3000/admin](http://localhost:3000/admin).

## Variables de entorno

Ver [`.env.example`](.env.example). Los secretos viven en `.env.local` (ignorado por git) y nunca se versionan:

| Variable | Descripción |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | ID de la cuenta de Cloudflare |
| `CLOUDFLARE_D1_DATABASE_NAME` | Nombre de la base D1 (`motros`) |
| `CLOUDFLARE_D1_DATABASE_ID` | ID de la base D1 |
| `ADMIN_USER` / `ADMIN_PASS` | Credenciales de acceso al panel `/admin` |
| `ADMIN_SECRET` | Valor de la cookie de sesión del admin |

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servir la compilación |
| `npm run lint` | ESLint |
