import { describe, expect, it } from "vitest";
import type { MouvementFormState, MouvementStock } from "@/types/mouvement";
import {
  buildSummary,
  formatMouvementTrajetLabel,
  computeStats,
  emptyForm,
  filterMouvements,
  formatEmballageLabel,
  formatGraphQLDateTime,
  formatQuantity,
  getEntrepotIdForLots,
  getMouvementTypeLabel,
  getSelectedLotAvailable,
  isMouvementBrouillon,
  mouvementHasLot,
  resolveMouvementLotId,
  validateForm,
  validateQuantityAgainstLot,
} from "./mouvement.helpers";
import { sortTableRows } from "./tableSort";

function mouvement(partial: Partial<MouvementStock>): MouvementStock {
  return {
    id: "1",
    type_mouvement: "PRD",
    emballage_id: "1",
    quantite: 1,
    statut: "BROUILLON",
    ...partial,
  };
}

describe("mouvement.helpers", () => {
  it("formatQuantity formate en fr-FR", () => {
    expect(formatQuantity(null)).toBe("-");
    expect(formatQuantity(1234.5)).toContain("234");
  });

  it("formatEmballageLabel combine code et nom", () => {
    expect(formatEmballageLabel(null)).toBe("-");
    expect(formatEmballageLabel({ id: "1", code: "SAC", name: "Sac" })).toBe(
      "SAC · Sac"
    );
  });

  it("isMouvementBrouillon est insensible à la casse", () => {
    expect(isMouvementBrouillon("brouillon")).toBe(true);
    expect(isMouvementBrouillon("VALIDE")).toBe(false);
  });

  it("getMouvementTypeLabel retourne le libellé affiché", () => {
    expect(getMouvementTypeLabel("PRD")).toBe("Production");
    expect(getMouvementTypeLabel("CDD")).toBe("Transfert");
    expect(getMouvementTypeLabel("EMC")).toBe("EMC");
    expect(getMouvementTypeLabel(null)).toBe("");
  });

  it("trie les mouvements par libellé de type (pas par code)", () => {
    const rows = [
      mouvement({ id: "1", type_mouvement: "CDD" }),
      mouvement({ id: "2", type_mouvement: "PTE" }),
      mouvement({ id: "3", type_mouvement: "PRD" }),
      mouvement({ id: "4", type_mouvement: "SPL" }),
    ];
    const columns = {
      typeMouvement: {
        accessor: (m: MouvementStock) => getMouvementTypeLabel(m.type_mouvement),
        type: "string" as const,
      },
    };
    const asc = sortTableRows(rows, "typeMouvement", "asc", columns);
    expect(asc.map((m) => getMouvementTypeLabel(m.type_mouvement))).toEqual([
      "Perte",
      "Production",
      "Surplus",
      "Transfert",
    ]);
  });

  it("computeStats agrège par statut et type", () => {
    const stats = computeStats([
      mouvement({ statut: "BROUILLON", type_mouvement: "PRD" }),
      mouvement({ statut: "VALIDE", type_mouvement: "CDD" }),
      mouvement({ statut: "VALIDE", type_mouvement: "PTE" }),
      mouvement({ statut: "VALIDE", type_mouvement: "SPL" }),
    ]);
    expect(stats).toEqual({
      total: 4,
      brouillons: 1,
      valides: 3,
      transferts: 1,
      sortiesProduction: 1,
      pertes: 1,
      surplus: 1,
    });
  });

  it("filterMouvements filtre recherche, type et statut", () => {
    const items = [
      mouvement({
        code_mouvement: "MVT-001",
        type_mouvement: "CDD",
        statut: "VALIDE",
        emballage: { id: "1", code: "SAC", name: "Sac plastique" },
      }),
      mouvement({
        code_mouvement: "MVT-002",
        type_mouvement: "PRD",
        statut: "BROUILLON",
      }),
    ];
    expect(filterMouvements(items, "sac", "ALL", "ALL")).toHaveLength(1);
    expect(filterMouvements(items, "", "CDD", "ALL")).toHaveLength(1);
    expect(filterMouvements(items, "", "ALL", "BROUILLON")).toHaveLength(1);
  });

  it("formatGraphQLDateTime convertit datetime-local", () => {
    expect(formatGraphQLDateTime("2026-05-20T14:30")).toBe("2026-05-20 14:30:00");
    expect(formatGraphQLDateTime("")).toBeNull();
  });

  it("validateForm retourne les erreurs métier", () => {
    const empty: MouvementFormState = {
      type: "PRD",
      emballageId: "",
      lotId: "",
      sourceId: "",
      destId: "",
      quantite: "",
      motif: "",
      dateMouvement: "2026-05-20T10:00",
    };
    expect(validateForm(empty)).toContain("emballage");

    const cdd: MouvementFormState = {
      ...empty,
      type: "CDD",
      emballageId: "1",
      quantite: 5,
      sourceId: "1",
      destId: "1",
      lotId: "1",
    };
    expect(validateForm(cdd)).toContain("différentes");

    const emc: MouvementFormState = {
      ...empty,
      type: "EMC",
      emballageId: "1",
      quantite: 5,
      destId: "2",
    };
    expect(validateForm(emc)).toBeNull();

    const pte: MouvementFormState = {
      ...empty,
      type: "PTE",
      emballageId: "1",
      quantite: 2,
      sourceId: "1",
      lotId: "1",
      motif: "",
    };
    expect(validateForm(pte)).toContain("motif");
  });

  it("emptyForm et getEntrepotIdForLots", () => {
    const form = emptyForm();
    expect(form.type).toBe("PRD");
    expect(getEntrepotIdForLots("PRD", { ...form, sourceId: "5" })).toBe("5");
    expect(getEntrepotIdForLots("SPL", { ...form, destId: "9" })).toBe("9");
  });

  it("resolveMouvementLotId lit lot_id ou relation lot", () => {
    expect(resolveMouvementLotId({ lot_id: "42", lot: null })).toBe("42");
    expect(
      resolveMouvementLotId({
        lot_id: null,
        lot: { id: "7", code_lot: "LOT-7", emballage_id: "1" },
      })
    ).toBe("7");
    expect(resolveMouvementLotId({ lot_id: null, lot: null })).toBeNull();
    expect(
      mouvementHasLot({ lot_id: null, lot: { id: "3", code_lot: "X", emballage_id: "1" } })
    ).toBe(true);
  });

  it("getSelectedLotAvailable retourne le stock du lot", () => {
    expect(
      getSelectedLotAvailable(
        [{ lot_id: "1", entrepot_id: "1", emballage_id: "1", stock_disponible: 12 }],
        "1"
      )
    ).toBe(12);
  });

  it("buildSummary assemble les libellés", () => {
    const form = {
      type: "PRD" as const,
      emballageId: "e1",
      lotId: "l1",
      sourceId: "s1",
      destId: "",
      quantite: 4,
      motif: "",
      dateMouvement: "2026-05-20T10:00",
    };
    const summary = buildSummary(
      form,
      [{ id: "e1", code: "SAC", name: "Sac" }],
      [{ id: "s1", nom: "E1", adresse: "Rue A" }],
      [
        {
          lot_id: "l1",
          entrepot_id: "s1",
          emballage_id: "e1",
          code_lot: "LOT-1",
          stock_disponible: 10,
        },
      ]
    );
    expect(summary.emballageLabel).toContain("SAC");
    expect(summary.lotLabel).toBe("LOT-1");
    expect(summary.trajetLabel).toBe("Rue A");
  });

  it("formatMouvementTrajetLabel n'affiche pas la flèche sans destination", () => {
    expect(formatMouvementTrajetLabel("PRD", "Rue A", null)).toBe("Rue A");
    expect(formatMouvementTrajetLabel("EMC", null, "Rue B")).toBe("Rue B");
    expect(formatMouvementTrajetLabel("CDD", "Rue A", "Rue B")).toBe("Rue A → Rue B");
    expect(formatMouvementTrajetLabel("PRD", null, null)).toBeNull();
  });

  it("validateQuantityAgainstLot refuse quantité trop élevée", () => {
    const form: MouvementFormState = {
      type: "PRD",
      emballageId: "1",
      lotId: "10",
      sourceId: "1",
      destId: "",
      quantite: 100,
      motif: "",
      dateMouvement: "2026-05-20T10:00",
    };
    expect(validateQuantityAgainstLot(form, 50)).toContain("dépasse");
    expect(validateQuantityAgainstLot(form, null)).toBeNull();
  });
});
