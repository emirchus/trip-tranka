import { cookies, headers } from "next/headers";
import { LegalPage } from "@/components/legal-page";
import { normalizeLocale } from "@/lib/i18n";
import { termsDocuments } from "@/lib/legal-copy";

export default async function TermsPage() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(
    cookieStore.get("tranka_locale")?.value ??
      requestHeaders.get("accept-language") ??
      "es-AR",
  );
  return (
    <LegalPage
      document={termsDocuments[locale]}
      backLabel={
        locale === "en" ? "Back" : locale === "pt-BR" ? "Voltar" : "Volver"
      }
    />
  );
}
