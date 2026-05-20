import { describe, expect, it } from "vitest";
import {
  biDataScopeForRole,
  canAccessPath,
  canQueryCommandesList,
  defaultHomePath,
  sidebarBiNavLabel,
  toAccessRole,
} from "./access";

describe("toAccessRole", () => {
  it("normalise les rôles backend", () => {
    expect(toAccessRole("admin")).toBe("ADMIN");
    expect(toAccessRole("CONTRAT")).toBe("LOGISTIQUE");
    expect(toAccessRole("unknown")).toBeNull();
  });
});

describe("defaultHomePath", () => {
  it("redirige selon le rôle", () => {
    expect(defaultHomePath("LOGISTIQUE")).toBe("/commandes");
    expect(defaultHomePath("FINANCE")).toBe("/factures");
    expect(defaultHomePath("STOCK")).toBe("/");
  });
});

describe("canAccessPath", () => {
  it("autorise ADMIN partout", () => {
    expect(canAccessPath("/factures", "ADMIN")).toBe(true);
    expect(canAccessPath("/stock", "ADMIN")).toBe(true);
  });

  it("restreint FINANCE aux factures", () => {
    expect(canAccessPath("/factures", "FINANCE")).toBe(true);
    expect(canAccessPath("/commandes", "FINANCE")).toBe(false);
  });

  it("restreint STOCK au dashboard et aux routes stock", () => {
    expect(canAccessPath("/", "STOCK")).toBe(true);
    expect(canAccessPath("/stock-inventaire", "STOCK")).toBe(true);
    expect(canAccessPath("/commandes", "STOCK")).toBe(false);
  });
});

describe("canQueryCommandesList", () => {
  it("autorise ADMIN et LOGISTIQUE", () => {
    expect(canQueryCommandesList("ADMIN")).toBe(true);
    expect(canQueryCommandesList("LOGISTIQUE")).toBe(true);
    expect(canQueryCommandesList("CONTRAT")).toBe(true);
    expect(canQueryCommandesList("FINANCE")).toBe(false);
  });
});

describe("biDataScopeForRole", () => {
  it("mappe chaque rôle à son périmètre BI", () => {
    expect(biDataScopeForRole("ADMIN")).toBe("full");
    expect(biDataScopeForRole("STOCK")).toBe("stock");
    expect(biDataScopeForRole("LOGISTIQUE")).toBe("logistique");
    expect(biDataScopeForRole("FINANCE")).toBe("finance");
  });
});

describe("sidebarBiNavLabel", () => {
  it("adapte le libellé menu BI", () => {
    expect(sidebarBiNavLabel("STOCK")).toBe("BI — Stock");
    expect(sidebarBiNavLabel("ADMIN")).toBe("Tableau BI");
  });
});
