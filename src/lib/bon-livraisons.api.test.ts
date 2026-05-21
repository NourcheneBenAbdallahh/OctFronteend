import { describe, expect, it } from "vitest";
import type { BonLivraison } from "@/types/bon-livraison";
import { normalizeBonLivraison } from "./bon-livraisons.api";

describe("normalizeBonLivraison", () => {
  it("conserve VALIDE et force ANNULE sinon", () => {
    const valide = { id: "1", statut: "VALIDE" } as BonLivraison;
    expect(normalizeBonLivraison(valide).statut).toBe("VALIDE");

    const autre = { id: "2", statut: "BROUILLON" } as unknown as BonLivraison;
    expect(normalizeBonLivraison(autre).statut).toBe("VALIDE");

    const annule = { id: "3", statut: "ANNULE" } as BonLivraison;
    expect(normalizeBonLivraison(annule).statut).toBe("ANNULE");
  });
});
