import { describe, expect, it } from "vitest";
import type { Commande } from "@/types/commandes";
import { normalizeCommande } from "./commandes.api";

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
