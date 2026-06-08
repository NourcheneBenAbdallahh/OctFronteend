/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { buildFacturesCsvContent, exportFacturesCsv } from "./factures.csv";
import {
  buildInventaireCsvContent,
  exportInventaireCsv,
} from "./inventaire.export";
import { EMPTY_INVENTAIRE_FILTERS } from "@/lib/inventaire.filters";
import type { TableFacture } from "@/types/facture";
import type { TableInventaire } from "@/types/inventaire";

describe("exports inventaire et factures", () => {
  it("refuse un export inventaire vide", () => {
    expect(buildInventaireCsvContent([], EMPTY_INVENTAIRE_FILTERS)).toBe("");

    const click = vi.fn();
    const anchor = { click, href: "", download: "" } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    exportInventaireCsv([], EMPTY_INVENTAIRE_FILTERS);
    expect(click).not.toHaveBeenCalled();
  });

  it("inclut stock, écart et statut dans l'export inventaire CSV", () => {
    const rows: TableInventaire[] = [
      {
        id: "1",
        code_session: "INV-001",
        entrepot_id: "10",
        emballage_id: "20",
        stock_theorique: 30,
        stock_theorique_fige: 30,
        stock_physique: 28,
        ecart: -2,
        statut: "COMPTEE",
        date_inventaire: "2026-05-20 10:00:00",
        entrepot_name: "Tunis",
        emballage_name: "Sac",
      },
    ];

    const content = buildInventaireCsvContent(rows, EMPTY_INVENTAIRE_FILTERS);

    expect(content).toContain("INV-001");
    expect(content).toContain("Tunis");
    expect(content).toContain("Sac");
    expect(content).toContain("30");
    expect(content).toContain("28");
    expect(content).toContain("-2");
    expect(content).toContain("COMPTEE");
  });

  it("refuse un export factures vide", () => {
    expect(buildFacturesCsvContent([])).toBe("");

    const click = vi.fn();
    const anchor = { click, href: "", download: "" } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(anchor);

    exportFacturesCsv([]);
    expect(click).not.toHaveBeenCalled();
  });

  it("inclut montants et références BL dans l'export factures CSV", () => {
    const factures: TableFacture[] = [
      {
        id: "42",
        numero_facture: "FAC-2026-001",
        date_facture: "2026-05-20",
        statut: "VALIDE",
        montant_ht: 150.5,
        montant_penalites: 2.5,
        montant_ht_net: 148,
        montant_ttc: 176.12,
        jours_retard_total: 3,
        bon_livraisons: [
          {
            id: "7",
            numero_bl: "BL-2026-001",
            date_reception: "2026-05-18",
            quantite_recue: 10,
            is_factured: true,
          },
        ],
        fournisseur: { id: "1", raison_sociale: "Fournisseur Test" },
        contrat: { id: "2", numero_contrat: "CTR-001" },
      },
    ];

    const content = buildFacturesCsvContent(factures);

    expect(content).toContain("FAC-2026-001");
    expect(content).toContain("150,500");
    expect(content).toContain("176,120");
    expect(content).toContain("BL-2026-001");
    expect(content).toContain("Fournisseur Test");
    expect(content).toContain("CTR-001");
  });
});
