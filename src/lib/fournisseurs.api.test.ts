import { describe, expect, it } from "vitest";
import type { Fournisseur } from "@/types/fournisseur";
import { sanitizeFournisseurInput } from "./fournisseurs.api";

describe("sanitizeFournisseurInput", () => {
  it("normalise le statut INACTIF", () => {
    expect(sanitizeFournisseurInput({ statut: "INACTIF" }).statut).toBe("INACTIF");
    expect(sanitizeFournisseurInput({ statut: "actif" as "ACTIF" }).statut).toBe("ACTIF");
  });

  it("convertit les champs vides en null", () => {
    const out = sanitizeFournisseurInput({
      logo: "",
      telephone: "",
      registre_entreprise: "",
    });
    expect(out.logo).toBeNull();
    expect(out.telephone).toBeNull();
    expect(out.registre_entreprise).toBeNull();
  });

  it("convertit latitude en nombre", () => {
    const formValue = { latitude: "36.8" } as unknown as Partial<Fournisseur>;
    expect(sanitizeFournisseurInput(formValue).latitude).toBe(36.8);
    expect(sanitizeFournisseurInput({ latitude: null }).latitude).toBeNull();
  });

  it("ne retourne que les champs fournis", () => {
    const out = sanitizeFournisseurInput({ raison_sociale: "ACME" });
    expect(out).toEqual({ raison_sociale: "ACME" });
  });
});
