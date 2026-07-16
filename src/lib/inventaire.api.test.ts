import { describe, expect, it } from "vitest";
import type { StockInventaire } from "@/types/inventaire";
import { normalizeInventaire } from "./inventaire.api";

describe("normalizeInventaire", () => {
  it("utilise les noms relationnels quand présents", () => {
    const inv: StockInventaire = {
      id: "1",
      entrepot_id: "10",
      emballage_id: "20",
      stock_physique: 5,
      stock_theorique: 10,
      ecart: -5,
      statut: "BROUILLON",
      date_inventaire: "2026-05-20",
      entrepot: { id: "10", nom: "Tunis" },
      emballage: { id: "20", name: "Sac" },
    };
    const out = normalizeInventaire(inv);
    expect(out.entrepot_name).toBe("Tunis");
    expect(out.emballage_name).toBe("Sac");
    expect(out.entrepot_id).toBe("10");
    expect(out.emballage_id).toBe("20");
  });

  it("fallback sur les ids si relations absentes", () => {
    const out = normalizeInventaire({
      id: "2",
      entrepot_id: "3",
      emballage_id: "4",
      stock_physique: 0,
      stock_theorique: 0,
      ecart: 0,
      statut: "COMPTEE",
      date_inventaire: "2026-05-20",
    });
    expect(out.entrepot_name).toBe("Entrepôt #3");
    expect(out.emballage_name).toBe("Emballage #4");
  });
});
