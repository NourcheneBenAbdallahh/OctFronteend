import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Commande } from "@/types/commandes";
import { listAllCommandes, normalizeCommande } from "./commandes.api";

vi.mock("./graphqlClient", () => ({
  graphqlRequest: vi.fn(),
}));

import { graphqlRequest } from "./graphqlClient";

describe("listAllCommandes", () => {
  beforeEach(() => {
    vi.mocked(graphqlRequest).mockReset();
  });

  it("agrège toutes les pages jusqu'à lastPage", async () => {
    vi.mocked(graphqlRequest)
      .mockResolvedValueOnce({
        commandes: {
          data: [{ id: "1" } as Commande, { id: "2" } as Commande],
          paginatorInfo: { count: 2, currentPage: 1, lastPage: 2, perPage: 2, total: 3 },
        },
      })
      .mockResolvedValueOnce({
        commandes: {
          data: [{ id: "3" } as Commande],
          paginatorInfo: { count: 1, currentPage: 2, lastPage: 2, perPage: 2, total: 3 },
        },
      });

    const all = await listAllCommandes(undefined, 2);
    expect(all.map((c) => c.id)).toEqual(["1", "2", "3"]);
    expect(graphqlRequest).toHaveBeenCalledTimes(2);
  });
});

describe("normalizeCommande", () => {
  it("conserve un statut autorisé", () => {
    const item = {
      id: "1",
      statut: "VALIDEE",
    } as Commande;
    expect(normalizeCommande(item).statut).toBe("VALIDEE");
  });

  it("remplace un statut inconnu par EN_ATTENTE", () => {
    const item = {
      id: "2",
      statut: "FOO",
    } as Commande;
    expect(normalizeCommande(item).statut).toBe("EN_ATTENTE");
  });

  it("normalise quantite_recue_total à 0 pour une nouvelle commande", () => {
    const item = {
      id: "3",
      statut: "EN_ATTENTE",
      quantite_recue_total: 0,
    } as Commande;
    const out = normalizeCommande(item);
    expect(out.statut).toBe("EN_ATTENTE");
    expect(out.quantite_recue_total).toBe(0);
  });
});
