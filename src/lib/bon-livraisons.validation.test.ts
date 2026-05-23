import { describe, expect, it } from "vitest";
import {
  computeResteALivrer,
  isQuantiteRecueBLValide,
  MESSAGE_QUANTITE_BL_TROP_ELEVEE,
} from "./bon-livraisons.validation";

describe("bon-livraisons.validation — reste à livrer", () => {
  it("calcule le reste (commande 100, déjà reçu 30)", () => {
    expect(computeResteALivrer(100, 30)).toBe(70);
  });

  it("plafonne le reste à 0 si déjà totalement reçu", () => {
    expect(computeResteALivrer(100, 100)).toBe(0);
    expect(computeResteALivrer(100, 120)).toBe(0);
  });

  it("accepte une quantité dans le reste (réception partielle)", () => {
    expect(isQuantiteRecueBLValide(40, 100, 0)).toBe(true);
    expect(isQuantiteRecueBLValide(30, 100, 60)).toBe(true);
  });

  it("accepte une réception complète exacte", () => {
    expect(isQuantiteRecueBLValide(70, 100, 30)).toBe(true);
    expect(isQuantiteRecueBLValide(100, 100, 0)).toBe(true);
  });

  it("refuse une quantité trop élevée", () => {
    expect(isQuantiteRecueBLValide(71, 100, 30)).toBe(false);
    expect(isQuantiteRecueBLValide(50, 100, 60)).toBe(false);
    expect(isQuantiteRecueBLValide(0, 100, 0)).toBe(false);
    expect(isQuantiteRecueBLValide(-5, 100, 0)).toBe(false);
  });

  it("expose un message d'erreur métier", () => {
    expect(MESSAGE_QUANTITE_BL_TROP_ELEVEE).toContain("reste");
  });
});
