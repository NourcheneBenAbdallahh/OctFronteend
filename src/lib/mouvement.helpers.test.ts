import { describe, expect, it } from "vitest";
import type { MouvementFormState, MouvementStock } from "@/types/mouvement";
import {
  buildSummary,
  computeStats,
  emptyForm,
  filterMouvements,
  formatEmballageLabel,
  formatGraphQLDateTime,
  formatQuantity,
  getEntrepotIdForLots,
  getSelectedLotAvailable,
  isMouvementBrouillon,
  validateForm,
  validateQuantityAgainstLot,
} from "./mouvement.helpers";

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
  });

  it("emptyForm et getEntrepotIdForLots", () => {
    const form = emptyForm();
    expect(form.type).toBe("PRD");
    expect(getEntrepotIdForLots("PRD", { ...form, sourceId: "5" })).toBe("5");
    expect(getEntrepotIdForLots("SPL", { ...form, destId: "9" })).toBe("9");
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
  });

  it("validateQuantityAgainstLot refuse quantité trop élevée", () => {
    const form: MouvementFormState = {
      type: "PRD",
      emballageId: "1",
      lotId: "10",
      sourceId: "1",
      destId: "",
      quantite: 100,
      dateMouvement: "2026-05-20T10:00",
    };
    expect(validateQuantityAgainstLot(form, 50)).toContain("dépasse");
    expect(validateQuantityAgainstLot(form, null)).toBeNull();
  });
});
