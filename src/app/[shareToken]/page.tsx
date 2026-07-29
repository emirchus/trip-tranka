import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { TripViewer } from "@/components/trip-viewer";
import { normalizeLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Viaje compartido · Tranka",
  description: "Seguí un viaje compartido con Tranka.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function SharedTripPage() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(
    cookieStore.get("tranka_locale")?.value ??
      requestHeaders.get("accept-language") ??
      "es-AR",
  );
  return <TripViewer locale={locale} />;
}
