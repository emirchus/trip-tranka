import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { normalizeLocale } from "@/lib/i18n";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-tranka",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = host
    ? new URL(`${protocol}://${host}`)
    : new URL("https://trip.tranka.app");
  return {
    metadataBase,
    title: "Viaje compartido · Tranka",
    description: "Seguí un viaje compartido con Tranka.",
    robots: { index: false, follow: false },
    applicationName: "Tranka Viajes",
    openGraph: {
      title: "Viaje compartido · Tranka",
      description: "Seguí un viaje compartido con Tranka.",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Viaje compartido · Tranka",
      description: "Seguí un viaje compartido con Tranka.",
      images: ["/og.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#69A8E8",
  colorScheme: "light dark",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(
    cookieStore.get("tranka_locale")?.value ??
      requestHeaders.get("accept-language") ??
      "es-AR",
  );

  return (
    <html lang={locale} className={spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
