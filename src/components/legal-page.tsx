import Link from "next/link";

type Document = {
  title: string;
  updated: string;
  intro: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
};

export function LegalPage({
  document,
  backLabel,
}: {
  document: Document;
  backLabel: string;
}) {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link href="/" className="back-link">
          ← {backLabel}
        </Link>
        <p className="eyebrow">Tranka · {document.updated}</p>
        <h1>{document.title}</h1>
        <p className="legal-intro">{document.intro}</p>
        {document.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
