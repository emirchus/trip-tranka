import Image from "next/image";
import Link from "next/link";
import { copyFor } from "@/lib/i18n";

export default function Home() {
  const copy = copyFor("es-AR");
  return (
    <main className="simple-page">
      <section className="simple-card">
        <div className="brand-mark" aria-hidden="true">
          <Image src="/icon-192.png" alt="Tranka" width={100} height={100} />
        </div>
        <p className="eyebrow">Tranka</p>
        <h1>{copy.homeTitle}</h1>
        <p>{copy.homeBody}</p>
        <nav className="legal-links" aria-label={copy.legalLinks}>
          <Link href="/privacidad">{copy.privacy}</Link>
          <Link href="/terminos">{copy.terms}</Link>
        </nav>
      </section>
    </main>
  );
}
