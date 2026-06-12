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
        {children}
        <ClientEnhancements />
        <AdsManager />
      </body>
    </html>
  );
}
