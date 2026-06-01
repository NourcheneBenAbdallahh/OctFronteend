import { describe, expect, it } from "vitest";
import { getFournisseurStatutNote } from "./fournisseurNotes";

describe("getFournisseurStatutNote", () => {
  it("retourne la note personnalisée si présente", () => {
    expect(getFournisseurStatutNote("INACTIF", "Retards répétés")).toBe("Retards répétés");
  });

  it("retourne la suggestion par défaut sinon", () => {
    expect(getFournisseurStatutNote("INACTIF")).toContain("inactif");
    expect(getFournisseurStatutNote("ACTIF")).toContain("actif");
  });
});
