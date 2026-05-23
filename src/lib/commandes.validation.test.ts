import { describe, expect, it } from "vitest";
import {
  formatDateInputLocal,
  isDateLivraisonPrevueValide,
  MESSAGE_DATE_LIVRAISON_PASSEE,
} from "./commandes.validation";

const REF = new Date(2026, 4, 22); // 22 mai 2026

describe("commandes.validation — date livraison prévue", () => {
  it("formatDateInputLocal produit YYYY-MM-DD", () => {
    expect(formatDateInputLocal(REF)).toBe("2026-05-22");
  });

  it("accepte aujourd'hui et une date future", () => {
    expect(isDateLivraisonPrevueValide("2026-05-22", REF)).toBe(true);
    expect(isDateLivraisonPrevueValide("2026-06-01", REF)).toBe(true);
  });

  it("refuse une date passée", () => {
    expect(isDateLivraisonPrevueValide("2026-05-21", REF)).toBe(false);
    expect(isDateLivraisonPrevueValide("2025-12-01", REF)).toBe(false);
  });

  it("refuse une chaîne vide ou invalide", () => {
    expect(isDateLivraisonPrevueValide("", REF)).toBe(false);
    expect(isDateLivraisonPrevueValide("invalid", REF)).toBe(false);
  });

  it("expose un message d'erreur métier", () => {
    expect(MESSAGE_DATE_LIVRAISON_PASSEE).toContain("aujourd");
  });
});
