import { describe, expect, it } from "vitest";
import { computeCoverageQuantity } from "@/lib/prediction-order";
import type { ForecastInsight } from "@/lib/prediction";

const baseInsight: ForecastInsight = {
  stock_actuel: 100,
  min_stock: 50,
  conso_moyenne_jour: 10,
  conso_prd_moyenne_jour: 9,
  conso_pte_moyenne_jour: 1,
  commandes_en_cours: 20,
  lead_time_jours: 3,
  jours_avant_rupture: 12,
  niveau_alerte: "ATTENTION",
  message_agent: "",
  quantite_a_commander: 0,
  history_days: 30,
};

describe("computeCoverageQuantity", () => {
  it("calcule la quantité pour couvrir N jours", () => {
    // 10 * 14 = 140 besoin + 30 safety - (100 stock + 20 commandes) = 50
    expect(computeCoverageQuantity(baseInsight, 30, 14)).toBe(50);
  });

  it("retourne 0 si le stock suffit", () => {
    expect(
      computeCoverageQuantity(
        { ...baseInsight, stock_actuel: 500, commandes_en_cours: 0 },
        10,
        7
      )
    ).toBe(0);
  });
});
