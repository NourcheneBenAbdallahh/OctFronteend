import { describe, expect, it } from "vitest";
import type { UniteMesure } from "@/types/unite-mesure";
import {
  convertQuantityBetweenUnites,
  formatQuantitePrincipale,
  formatUnitCodeShort,
  normalizeUnitCode,
  resolvePrincipalUnitCode,
  unitesCompatibleQuantiteCommande,
} from "./unite-conversion";

const unites: UniteMesure[] = [
  {
    id: "1",
    code: "G",
    label: "Gramme",
    dimension: "masse",
    facteur_vers_kg: 0.001,
    sort_order: 1,
  },
  {
    id: "2",
    code: "KG",
    label: "Kilogramme",
    dimension: "masse",
    facteur_vers_kg: 1,
    sort_order: 2,
  },
  {
    id: "3",
    code: "UNITE",
    label: "Unité",
    dimension: "nombre",
    sort_order: 1,
  },
];

describe("normalizeUnitCode", () => {
  it("trim et uppercase", () => {
    expect(normalizeUnitCode(" kg ")).toBe("KG");
    expect(normalizeUnitCode(null)).toBe("");
  });
});

describe("formatUnitCodeShort", () => {
  it("retourne un tiret si vide", () => {
    expect(formatUnitCodeShort("")).toBe("—");
    expect(formatUnitCodeShort("l")).toBe("L");
  });
});

describe("resolvePrincipalUnitCode", () => {
  it("utilise KG par défaut", () => {
    expect(resolvePrincipalUnitCode(null, unites)).toBe("KG");
  });

  it("conserve une unité connue du référentiel", () => {
    expect(resolvePrincipalUnitCode("g", unites)).toBe("G");
  });
});

describe("unitesCompatibleQuantiteCommande", () => {
  it("filtre par dimension masse", () => {
    const compatible = unitesCompatibleQuantiteCommande("KG", unites);
    expect(compatible.map((u) => u.code)).toEqual(["G", "KG"]);
  });

  it("ne retourne que l'unité principale pour nombre", () => {
    const compatible = unitesCompatibleQuantiteCommande("UNITE", unites);
    expect(compatible).toHaveLength(1);
    expect(compatible[0]?.code).toBe("UNITE");
  });
});

describe("convertQuantityBetweenUnites", () => {
  it("convertit G vers KG", () => {
    expect(convertQuantityBetweenUnites(1000, "G", "KG", unites)).toBe(1);
  });

  it("retourne null si dimensions incompatibles", () => {
    expect(convertQuantityBetweenUnites(10, "KG", "UNITE", unites)).toBeNull();
  });
});

describe("formatQuantitePrincipale", () => {
  it("retourne un tiret si non fini", () => {
    expect(formatQuantitePrincipale(Number.NaN)).toBe("—");
  });

  it("formate un nombre en fr-FR", () => {
    expect(formatQuantitePrincipale(1234.5)).toMatch(/1/);
  });
});
