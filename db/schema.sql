-- Esquema de la base de datos D1 "motros" — Revista Motors
DROP TABLE IF EXISTS articulos;

CREATE TABLE articulos (
  slug        TEXT PRIMARY KEY,   -- identificador en la URL
  titulo      TEXT NOT NULL,
  fecha       TEXT,               -- ISO 8601
  portada     TEXT,               -- ruta de la imagen destacada
  extracto    TEXT,
  html        TEXT,               -- contenido del artículo (HTML)
  categorias  TEXT,               -- JSON: ["Reseñas", ...]
  tags        TEXT,               -- JSON: ["tesla", ...]
  creado_en   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_articulos_fecha ON articulos (fecha DESC);

-- Estado de los anuncios/banners (la lista base vive en src/lib/anuncios.ts).
-- Una fila por anuncio editado desde el panel; si no hay fila, se usan los
-- valores por defecto (activo, sin imagen personalizada).
CREATE TABLE IF NOT EXISTS anuncios (
  id     TEXT PRIMARY KEY,         -- coincide con ANUNCIOS[].id
  imagen TEXT,                     -- imagen personalizada (o NULL)
  activo INTEGER NOT NULL DEFAULT 1
);

-- Páginas del sitio original (snapshot del tema), servidas desde D1 en edge.
-- Una fila por URL; `data` es el JSON de PageData (head/body/scripts) exacto.
-- Se puebla con db/paginas.sql (generado desde public/site-data/pages).
CREATE TABLE IF NOT EXISTS paginas (
  slug TEXT PRIMARY KEY,           -- URL sin barras ("" = home)
  data TEXT NOT NULL               -- JSON de PageData
);

-- Índice de búsqueda de las noticias originales (se siembra con db/busqueda.sql).
-- Las noticias creadas en el panel se buscan en vivo desde `articulos`.
CREATE TABLE IF NOT EXISTS busqueda (
  slug    TEXT PRIMARY KEY,
  titulo  TEXT,
  thumb   TEXT,
  excerpt TEXT,
  texto   TEXT
);

-- Imágenes subidas desde el admin (servidas por /api/img/[id]).
CREATE TABLE IF NOT EXISTS imagenes (
  id        TEXT PRIMARY KEY,
  mime      TEXT NOT NULL,
  datos     TEXT NOT NULL,           -- contenido en base64
  creado_en TEXT DEFAULT (datetime('now'))
);
