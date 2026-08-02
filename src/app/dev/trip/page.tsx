import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { DevTripViewer } from "@/components/dev-trip-viewer";
import { normalizeLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dev trip · Tranka",
  robots: { index: false, follow: false, noarchive: true },
};

function isDevHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

export default async function DevTripPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!isDevHost(host)) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = normalizeLocale(
    cookieStore.get("tranka_locale")?.value ??
      requestHeaders.get("accept-language") ??
      "es-AR",
  );

  return <DevTripViewer locale={locale} />;
}
