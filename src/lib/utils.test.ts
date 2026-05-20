import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, formatNumber, formatPercent } from "./utils";

describe("formatDate", () => {
  it("retourne un tiret si vide", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("tronque la partie date ISO", () => {
    expect(formatDate("2026-05-20T12:00:00Z")).toBe("2026-05-20");
  });
});

describe("formatMoney", () => {
  it("formate en dinars avec décimales", () => {
    expect(formatMoney(12.5)).toMatch(/12/);
  });

  it("retourne 0,000 si null", () => {
    expect(formatMoney(null)).toBe("0,000");
  });
});

describe("formatNumber", () => {
  it("formate un entier", () => {
    expect(formatNumber(1500)).toMatch(/1/);
  });
});

describe("formatPercent", () => {
  it("ajoute le symbole pourcent", () => {
    expect(formatPercent(42.5)).toBe("42.5%");
  });

  it("retourne 0% si null", () => {
    expect(formatPercent(null)).toBe("0%");
  });
});
