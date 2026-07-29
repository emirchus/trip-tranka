import { describe, expect, it } from "vitest";
import { copyFor, normalizeLocale } from "@/lib/i18n";

describe("locales", () => {
  it.each([
    ["es-AR,es;q=0.9", "es-AR"],
    ["es-MX", "es"],
    ["en-US", "en"],
    ["pt-PT", "pt-BR"],
    ["de-DE", "es-AR"],
  ] as const)("normalizes %s to %s", (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });

  it("has clear live states in every locale", () => {
    for (const locale of ["es-AR", "es", "en", "pt-BR"] as const) {
      const copy = copyFor(locale);
      expect(copy.onTheWay("Emir")).toContain("Emir");
      expect(copy.arriving("Emir")).toContain("Emir");
      expect(copy.arrived("Emir", "Retiro")).toContain("Retiro");
    }
  });
});
