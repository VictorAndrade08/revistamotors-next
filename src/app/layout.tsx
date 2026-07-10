import type { Metadata } from "next";
import "./globals.css";
import "./overrides.css";
import ClientEnhancements from "@/components/ClientEnhancements";
import AdsManager from "@/components/AdsManager";

export const metadata: Metadata = {
  title: "Revista Motors Ecuador",
  description:
    "Noticias, reseñas y tecnología del mundo automotriz en Ecuador y Latinoamérica.",
  metadataBase: new URL("https://revistamotors.com.ec"),
  icons: {
    icon: "/icon.webp",
    apple: "/icon.webp",
  },
  openGraph: {
    images: ["/icon.webp"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {/* React los eleva al <head> real: conexiones tempranas a los CDNs
            de imágenes (R2) y fuentes, antes de que el navegador parsee el
            head del tema (que va incrustado en el body). */}
        <link rel="preconnect" href="https://pub-25cde2184a5249da96fa022aae951321.r2.dev" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Revista Motors Ecuador"
          href="/feed.xml"
        />
        {children}
        <ClientEnhancements />
        <AdsManager />
      </body>
    </html>
  );
}
