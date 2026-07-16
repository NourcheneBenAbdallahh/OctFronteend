import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Facture } from "@/types/facture";
import { listAllFactures, normalizeFacture } from "./factures.api";

vi.mock("./graphqlClient", () => ({
  graphqlRequest: vi.fn(),
}));

import { graphqlRequest } from "./graphqlClient";

describe("listAllFactures", () => {
  beforeEach(() => {
    vi.mocked(graphqlRequest).mockReset();
  });

  it("agrège toutes les pages jusqu'à lastPage", async () => {
    vi.mocked(graphqlRequest)
      .mockResolvedValueOnce({
        factures: {
          data: [{ id: "1" } as Facture, { id: "2" } as Facture],
          paginatorInfo: { currentPage: 1, lastPage: 2, total: 3 },
        },
      })
      .mockResolvedValueOnce({
        factures: {
          data: [{ id: "3" } as Facture],
          paginatorInfo: { currentPage: 2, lastPage: 2, total: 3 },
        },
      });

    const all = await listAllFactures();
    expect(all.map((f) => f.id)).toEqual(["1", "2", "3"]);
    expect(graphqlRequest).toHaveBeenCalledTimes(2);
  });
});

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
