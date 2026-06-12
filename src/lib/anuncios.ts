// Anuncios (banners) del sitio, etiquetados por dónde aparecen.
export type Anuncio = {
  id: string;
  ubicacion: string;
  descripcion: string;
  path: string;
  ancho: number;
  alto: number;
};

export const ANUNCIOS: Anuncio[] = [
  {
    id: "horizontal",
    ubicacion: "Banner horizontal",
    descripcion: "Aparece arriba (sobre el logo) y entre el contenido.",
    path: "/assets/uploads/2023/07/MOTORS-BANNER-1500X170.jpg",
    ancho: 1500,
    alto: 170,
  },
  {
    id: "vertical",
    ubicacion: "Banner vertical (destacado)",
    descripcion: "Anuncio grande lateral / destacado dentro de las noticias.",
    path: "/assets/uploads/2024/07/RM-2.png",
    ancho: 600,
    alto: 900,
  },
  {
    id: "menu",
    ubicacion: "Banner del menú lateral",
    descripcion: "Sección «Publicidad» del menú y del buscador.",
    path: "/assets/uploads/2022/03/sb-banner.jpg",
    ancho: 600,
    alto: 900,
  },
];

export const ANUNCIO_PATHS = new Set(ANUNCIOS.map((a) => a.path));
