import { describe, expect, it } from "vitest";
import { normalizeFacture } from "./factures.api";

describe("normalizeFacture", () => {
  it("normalise montants et statut", () => {
    const out = normalizeFacture({
      id: "1",
      numero_facture: "F-001",
      montant_ht: "100.5",
      montant_penalites: null,
      montant_ht_net: "95",
      montant_ttc: "119.7",
      jours_retard_total: "3",
      statut: "VALIDE",
      bon_livraisons: null,
    });
    expect(out.montant_ht).toBe(100.5);
    expect(out.montant_ttc).toBe(119.7);
    expect(out.jours_retard_total).toBe(3);
    expect(out.statut).toBe("VALIDE");
    expect(out.bon_livraisons).toEqual([]);
  });

  it("force BROUILLON pour statut inconnu", () => {
    expect(normalizeFacture({ id: "2", statut: "UNKNOWN" }).statut).toBe(
      "BROUILLON"
    );
  });
});
