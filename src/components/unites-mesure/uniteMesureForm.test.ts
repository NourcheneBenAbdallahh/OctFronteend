import { describe, expect, it } from "vitest";
import { validateUniteMesureForm } from "./uniteMesureForm";

describe("validateUniteMesureForm", () => {
  it("rejette un facteur négatif", () => {
    const errors = validateUniteMesureForm(
      {
        code: "Kg",
        label: "Kilogramme",
        dimension: "masse",
        facteur_vers_kg: "-5",
        facteur_vers_l: "",
      },
      false
    );
    expect(errors.facteur_vers_kg).toBeDefined();
  });

  it("valide une unité masse correcte", () => {
    const errors = validateUniteMesureForm(
      {
        code: "Kg",
        label: "Kilogramme",
        dimension: "masse",
        facteur_vers_kg: "1",
        facteur_vers_l: "",
      },
      false
    );
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
