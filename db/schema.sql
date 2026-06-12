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

-- Imágenes subidas desde el admin (servidas por /api/img/[id]).
CREATE TABLE IF NOT EXISTS imagenes (
  id        TEXT PRIMARY KEY,
  mime      TEXT NOT NULL,
  datos     TEXT NOT NULL,           -- contenido en base64
  creado_en TEXT DEFAULT (datetime('now'))
);
