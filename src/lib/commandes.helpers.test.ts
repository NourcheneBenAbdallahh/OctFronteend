import { describe, expect, it } from "vitest";
import type { TableCommande } from "@/types/commandes";
import {
  computeCommandeDashboardStats,
  computeCommandeStatusCounts,
  computeFluxTotalQuantite,
  computeJoursRestants,
  computeReliquatTotal,
  computeTauxReceptionPct,
  countCommandesEnRetard,
  filterCommandesByQuery,
  formatDelaiEcheanceLabel,
  isCommandeEnRetardTimeline,
  isCommandeEnRetardWidget,
  isCommandeLivraisonProchaine7J,
} from "./commandes.helpers";

const REF = new Date("2026-05-22T12:00:00");

function row(partial: Partial<TableCommande>): TableCommande {
  return {
    id: "1",
    numero_commande: "CMD-001",
    date_commande: "2026-05-01",
    date_livraison_prevue: "2026-05-25T12:00:00",
    statut: "VALIDEE",
    emballage_id: 1,
    quantite: 100,
    fournisseur_id: 10,
    contrat_id: 1,
    entrepot_id: 1,
    reste: 50,
    created_by: 1,
    ...partial,
  };
}

describe("commandes.helpers — compteurs", () => {
  const dataset: TableCommande[] = [
    row({ id: "1", statut: "EN_ATTENTE", quantite: 10, reste: 10 }),
    row({ id: "2", statut: "VALIDEE", quantite: 20, reste: 5 }),
    row({ id: "3", statut: "VALIDEE", quantite: 30, reste: 0 }),
    row({ id: "4", statut: "RECEPTIONNEE", quantite: 40, reste: 0 }),
    row({
      id: "5",
      statut: "PARTIELLEMENT_RECEPTIONNEE",
      date_livraison_prevue: "2026-05-20T12:00:00",
      quantite: 15,
      reste: 7,
    }),
  ];

  it("met à jour les compteurs par statut", () => {
    const counts = computeCommandeStatusCounts(dataset);
    expect(counts.EN_ATTENTE).toBe(1);
    expect(counts.VALIDEE).toBe(2);
    expect(counts.PARTIELLEMENT_RECEPTIONNEE).toBe(1);
    expect(counts.RECEPTIONNEE).toBe(1);
    expect(counts.ANNULEE).toBe(0);
  });

  it("recalcule les compteurs quand les lignes changent", () => {
    const initial = computeCommandeStatusCounts(dataset);
    const afterCancel = computeCommandeStatusCounts([
      ...dataset,
      row({ id: "6", statut: "ANNULEE" }),
      row({ id: "7", statut: "ANNULEE" }),
    ]);
    expect(initial.ANNULEE).toBe(0);
    expect(afterCancel.ANNULEE).toBe(2);
    expect(afterCancel.EN_ATTENTE).toBe(initial.EN_ATTENTE);
  });

  it("calcule le flux total, le reliquat et le taux de réception", () => {
    expect(computeFluxTotalQuantite(dataset)).toBe(115);
    expect(computeReliquatTotal(dataset)).toBe(22);
    expect(computeTauxReceptionPct(dataset)).toBe(20);
  });

  it("compte les commandes en retard pour le widget", () => {
    expect(countCommandesEnRetard(dataset, REF)).toBe(1);
    const noneLate = dataset.map((r) =>
      row({ ...r, date_livraison_prevue: "2026-06-01T12:00:00" })
    );
    expect(countCommandesEnRetard(noneLate, REF)).toBe(0);
  });

  it("calcule les indicateurs tableau de bord", () => {
    const stats = computeCommandeDashboardStats(dataset, REF);
    expect(stats.actives).toBe(4);
    expect(stats.enRetard).toBe(1);
    expect(stats.reliquat).toBe(22);
    expect(stats.commandesOuvertes).toBe(3);
    expect(stats.totalRecu).toBe(0);
    expect(stats.couverture).toBe(0);
    expect(stats.livraisons7j).toBeGreaterThanOrEqual(0);
  });
});

describe("commandes.helpers — jours de retard", () => {
  it("affiche « 1 J. de retard » pour une échéance dépassée d'un jour", () => {
    const jours = computeJoursRestants("2026-05-21T12:00:00", REF);
    expect(jours).toBe(-1);
    expect(isCommandeEnRetardTimeline(jours, "VALIDEE")).toBe(true);
    expect(formatDelaiEcheanceLabel(jours, "VALIDEE")).toBe("1 J. de retard");
  });

  it("affiche « 3 Jours restants » avant l'échéance", () => {
    const jours = computeJoursRestants("2026-05-25T12:00:00", REF);
    expect(jours).toBe(3);
    expect(formatDelaiEcheanceLabel(jours, "VALIDEE")).toBe("3 Jours restants");
  });

  it("affiche « Échéance atteinte » le jour J (non réceptionnée)", () => {
    const jours = computeJoursRestants("2026-05-22T12:00:00", REF);
    expect(jours).toBe(0);
    expect(formatDelaiEcheanceLabel(jours, "VALIDEE")).toBe("Échéance atteinte");
  });

  it("n'affiche pas de retard pour une commande RECEPTIONNEE", () => {
    const jours = computeJoursRestants("2026-05-10T12:00:00", REF);
    expect(jours).toBeLessThan(0);
    expect(isCommandeEnRetardTimeline(jours, "RECEPTIONNEE")).toBe(false);
    expect(formatDelaiEcheanceLabel(jours, "RECEPTIONNEE")).toBe("Échéance atteinte");
  });

  it("détecte le retard widget si date passée et statut actif", () => {
    expect(isCommandeEnRetardWidget("2026-05-20T12:00:00", "VALIDEE", REF)).toBe(true);
    expect(isCommandeEnRetardWidget("2026-05-20T12:00:00", "RECEPTIONNEE", REF)).toBe(false);
    expect(isCommandeEnRetardWidget("2026-06-01T12:00:00", "VALIDEE", REF)).toBe(false);
  });
});

describe("commandes.helpers — recherche par référence", () => {
  const rows: TableCommande[] = [
    row({ id: "1", numero_commande: "CMD-2026-042", fournisseur_id: 10 }),
    row({ id: "2", numero_commande: "CMD-2026-099", fournisseur_id: 20 }),
    row({ id: "3", numero_commande: "CMD-LEGACY-01", fournisseur_id: 30, statut: "EN_ATTENTE" }),
  ];
  const fournisseurs = new Map<string, string>([
    ["10", "Agro Tunis"],
    ["20", "Pack Sfax"],
    ["30", "Import Med"],
  ]);

  it("retourne toutes les lignes si la recherche est vide", () => {
    expect(filterCommandesByQuery(rows, "", fournisseurs)).toHaveLength(3);
    expect(filterCommandesByQuery(rows, "   ", fournisseurs)).toHaveLength(3);
  });

  it("filtre par numéro de commande (partiel, insensible à la casse)", () => {
    const out = filterCommandesByQuery(rows, "cmd-2026-042", fournisseurs);
    expect(out).toHaveLength(1);
    expect(out[0].numero_commande).toBe("CMD-2026-042");
  });

  it("filtre par fragment de référence", () => {
    const out = filterCommandesByQuery(rows, "LEGACY", fournisseurs);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("3");
  });

  it("filtre par nom fournisseur", () => {
    const out = filterCommandesByQuery(rows, "sfax", fournisseurs);
    expect(out).toHaveLength(1);
    expect(out[0].fournisseur_id).toBe(20);
  });

  it("filtre par code statut (clic badge)", () => {
    const out = filterCommandesByQuery(rows, "EN_ATTENTE", fournisseurs);
    expect(out).toHaveLength(1);
    expect(out[0].statut).toBe("EN_ATTENTE");
  });

  it("filtre les commandes actives (carte rapide)", () => {
    const mixed = [
      ...rows,
      row({ id: "4", statut: "RECEPTIONNEE" }),
      row({ id: "5", statut: "ANNULEE" }),
    ];
    const out = filterCommandesByQuery(mixed, "ACTIVES", fournisseurs);
    expect(out.every((r) => r.statut !== "RECEPTIONNEE" && r.statut !== "ANNULEE")).toBe(true);
    expect(out).toHaveLength(3);
  });

  it("filtre les livraisons dans les 7 prochains jours", () => {
    const ref = new Date("2026-05-22T12:00:00");
    const soon = row({
      id: "10",
      statut: "VALIDEE",
      date_livraison_prevue: "2026-05-25T12:00:00",
    });
    expect(isCommandeLivraisonProchaine7J(soon.date_livraison_prevue, soon.statut, ref)).toBe(true);
    const out = filterCommandesByQuery([soon], "PROCHAINES_7J", fournisseurs, ref);
    expect(out).toHaveLength(1);
  });

  it("retourne aucun résultat si la référence est introuvable", () => {
    expect(filterCommandesByQuery(rows, "CMD-INEXISTANT", fournisseurs)).toHaveLength(0);
  });
});
