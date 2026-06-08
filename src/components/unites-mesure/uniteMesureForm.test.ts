import { describe, expect, it } from "vitest";
import { parseSortOrder, validateUniteMesureForm } from "./uniteMesureForm";

describe("parseSortOrder", () => {
  it("accepte 0", () => {
    expect(parseSortOrder("0")).toBe(0);
  });
});

describe("validateUniteMesureForm", () => {
  it("rejette un facteur négatif", () => {
    const errors = validateUniteMesureForm(
      {
        code: "Kg",
        label: "Kilogramme",
        dimension: "masse",
        facteur_vers_kg: "-5",
        facteur_vers_l: "",
        sort_order: "0",
      },
      false
    );
    expect(errors.facteur_vers_kg).toBeDefined();
  });

  it("accepte sort_order à 0", () => {
    const errors = validateUniteMesureForm(
      {
        code: "Kg",
        label: "Kilogramme",
        dimension: "masse",
        facteur_vers_kg: "1",
        facteur_vers_l: "",
        sort_order: "0",
      },
      false
    );
    expect(errors.sort_order).toBeUndefined();
  });
});
