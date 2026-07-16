import { describe, expect, it } from "vitest";
import type { TableInventaire } from "@/types/inventaire";
import {
  applyInventaireFilters,
  buildInventaireFiltersLabel,
  EMPTY_INVENTAIRE_FILTERS,
} from "./inventaire.filters";

function row(partial: Partial<TableInventaire>): TableInventaire {
  return {
    id: "1",
    entrepot_id: "10",
    emballage_id: "20",
    stock_physique: 5,
    stock_theorique: 10,
    ecart: -5,
    statut: "BROUILLON",
    date_inventaire: "2026-05-15T10:00:00",
    entrepot_name: "Tunis",
    emballage_name: "Sac",
    ...partial,
  };
}

describe("inventaire.filters", () => {
  const data: TableInventaire[] = [
    row({ id: "1", ecart: 0, statut: "REGULARISEE", code_session: "S1" }),
    row({ id: "2", ecart: -3, statut: "COMPTEE", entrepot_id: "11", entrepot_name: "Sfax" }),
    row({ id: "3", ecart: 2, statut: "BROUILLON", emballage_name: "Carton" }),
  ];

  it("filtre par recherche et entrepôt", () => {
    const out = applyInventaireFilters(
      data,
      { ...EMPTY_INVENTAIRE_FILTERS, search: "carton", entrepot: "10" }
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("3");
  });

  it("filtre ecart parfait et non régularisé", () => {
    expect(
      applyInventaireFilters(data, { ...EMPTY_INVENTAIRE_FILTERS, status: "perfect" })
    ).toHaveLength(1);
    expect(
      applyInventaireFilters(data, {
        ...EMPTY_INVENTAIRE_FILTERS,
        status: "non_regularise",
      })
    ).toHaveLength(2);
  });

  it("filtre par dates et périodes", () => {
    const withDates = [
      row({
        id: "10",
        date_inventaire: "2026-05-10T08:00:00",
        periode_debut: "2026-05-01",
        periode_fin: "2026-05-31",
      }),
    ];
    const filtered = applyInventaireFilters(withDates, {
      ...EMPTY_INVENTAIRE_FILTERS,
      date_inventaire_from: "2026-05-01",
      date_inventaire_to: "2026-05-31",
      periode_debut_from: "2026-05-01",
      periode_fin_to: "2026-05-31",
    });
    expect(filtered).toHaveLength(1);
  });

  it("filtre ecarts positifs et négatifs", () => {
    expect(
      applyInventaireFilters(data, { ...EMPTY_INVENTAIRE_FILTERS, status: "negative" })
    ).toHaveLength(1);
    expect(
      applyInventaireFilters(data, { ...EMPTY_INVENTAIRE_FILTERS, status: "positive" })
    ).toHaveLength(1);
  });

  it("ne filtre pas par mode jour mais filtre par session", () => {
    const withDates = [
      row({ id: "10", date_inventaire: "2026-05-10T08:00:00", code_session: "S-A" }),
      row({ id: "11", date_inventaire: "2026-06-01T08:00:00", code_session: "S-B" }),
    ];
    const byDay = applyInventaireFilters(withDates, {
      ...EMPTY_INVENTAIRE_FILTERS,
      date_mode: "day",
      pivot_day: "2026-05-10",
    });
    expect(byDay).toHaveLength(2);

    const bySession = applyInventaireFilters(withDates, {
      ...EMPTY_INVENTAIRE_FILTERS,
      code_session: "S-A",
    });
    expect(bySession).toHaveLength(1);
    expect(bySession[0].id).toBe("10");
  });

  it("filtre entrepôt même si id numérique vs string", () => {
    const withNumericId = [row({ id: "10", entrepot_id: 10 as unknown as string })];
    const filtered = applyInventaireFilters(withNumericId, {
      ...EMPTY_INVENTAIRE_FILTERS,
      entrepot: "10",
    });
    expect(filtered).toHaveLength(1);
  });

  it("buildInventaireFiltersLabel résume les filtres actifs", () => {
    expect(buildInventaireFiltersLabel(EMPTY_INVENTAIRE_FILTERS)).toBe(
      "Tous les inventaires"
    );
    const label = buildInventaireFiltersLabel({
      ...EMPTY_INVENTAIRE_FILTERS,
      code_session: "S1",
      status: "negative",
    });
    expect(label).toContain("session S1");
    expect(label).toContain("negative");
  });
});
