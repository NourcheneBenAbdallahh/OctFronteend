import { describe, expect, it } from "vitest";
import {
  biDataScopeForRole,
  canAccessPath,
  canManageEmballagesCatalog,
  canQueryCommandesList,
  canUseStockAi,
  canViewFournisseursList,
  canViewFournisseursMap,
  canViewPredictiveStockAlerts,
  defaultHomePath,
  filterCommandesForCalendarUser,
  filterStocksForDashboardUser,
  isAdminUser,
  shouldBypassRouteAccess,
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

  it("autorise ADMIN et STOCK sur /prediction", () => {
    expect(canAccessPath("/prediction", "ADMIN")).toBe(true);
    expect(canAccessPath("/prediction", "STOCK")).toBe(true);
    expect(canAccessPath("/prediction", "FINANCE")).toBe(false);
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

describe("shouldBypassRouteAccess", () => {
  it("bypass verify-email et reset-password", () => {
    expect(shouldBypassRouteAccess("/verify-email")).toBe(true);
    expect(shouldBypassRouteAccess("/reset-password/confirm")).toBe(true);
    expect(shouldBypassRouteAccess("/stock")).toBe(false);
  });
});

describe("isAdminUser", () => {
  it("détecte ADMIN insensible à la casse", () => {
    expect(isAdminUser("admin")).toBe(true);
    expect(isAdminUser("STOCK")).toBe(false);
  });
});

describe("canManageEmballagesCatalog", () => {
  it("autorise ADMIN et LOGISTIQUE", () => {
    expect(canManageEmballagesCatalog("ADMIN")).toBe(true);
    expect(canManageEmballagesCatalog("LOGISTIQUE")).toBe(true);
    expect(canManageEmballagesCatalog("STOCK")).toBe(false);
  });
});

describe("canUseStockAi", () => {
  it("autorise ADMIN et STOCK", () => {
    expect(canUseStockAi("ADMIN")).toBe(true);
    expect(canUseStockAi("STOCK")).toBe(true);
    expect(canUseStockAi("FINANCE")).toBe(false);
  });
});

describe("canViewPredictiveStockAlerts", () => {
  it("autorise full et stock", () => {
    expect(canViewPredictiveStockAlerts("ADMIN")).toBe(true);
    expect(canViewPredictiveStockAlerts("STOCK")).toBe(true);
    expect(canViewPredictiveStockAlerts("FINANCE")).toBe(false);
  });
});

describe("filterStocksForDashboardUser", () => {
  const stocks = [
    { id: 1, user_id: 10 },
    { id: 2, user_id: 20 },
  ];

  it("ADMIN voit tout", () => {
    expect(filterStocksForDashboardUser(stocks, "10", "ADMIN")).toHaveLength(2);
  });

  it("STOCK voit tout", () => {
    expect(filterStocksForDashboardUser(stocks, "10", "STOCK")).toHaveLength(2);
  });

  it("autre rôle filtre par user_id", () => {
    expect(filterStocksForDashboardUser(stocks, "20", "FINANCE")).toEqual([
      { id: 2, user_id: 20 },
    ]);
  });
});

describe("filterCommandesForCalendarUser", () => {
  const commandes = [{ id: 1, created_by: 5 }, { id: 2, created_by: 9 }];

  it("LOGISTIQUE voit tout", () => {
    expect(filterCommandesForCalendarUser(commandes, "5", "LOGISTIQUE")).toHaveLength(2);
  });

  it("filtre par created_by sinon", () => {
    expect(filterCommandesForCalendarUser(commandes, "9", "FINANCE")).toEqual([
      { id: 2, created_by: 9 },
    ]);
  });
});

describe("permissions BI et fournisseurs", () => {
  it("canViewFournisseursList et map", () => {
    expect(canViewFournisseursList("LOGISTIQUE")).toBe(true);
    expect(canViewFournisseursMap("CONTRAT")).toBe(true);
    expect(canViewFournisseursList("STOCK")).toBe(false);
  });

  it("canViewPredictiveStockAlerts selon le scope", () => {
    expect(canViewPredictiveStockAlerts("ADMIN")).toBe(true);
    expect(canViewPredictiveStockAlerts("FINANCE")).toBe(false);
  });

  it("sidebarBiNavLabel par scope", () => {
    expect(sidebarBiNavLabel("STOCK")).toContain("Stock");
    expect(sidebarBiNavLabel("FINANCE")).toContain("Finance");
    expect(sidebarBiNavLabel("LOGISTIQUE")).toContain("Logistique");
    expect(sidebarBiNavLabel("ADMIN")).toBe("Tableau BI");
  });
});
