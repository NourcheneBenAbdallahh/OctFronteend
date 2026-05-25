import { describe, expect, it } from "vitest";
import {
  buildAppTourSteps,
  countTourSteps,
  navTourSelector,
  pathToTourSlug,
} from "./appTour";

describe("appTour", () => {
  it("pathToTourSlug normalise les chemins", () => {
    expect(pathToTourSlug("/")).toBe("dashboard");
    expect(pathToTourSlug("/fournisseurs")).toBe("fournisseurs");
    expect(pathToTourSlug("/stock-inventaire")).toBe("stock-inventaire");
  });

  it("navTourSelector cible le menu latéral", () => {
    expect(navTourSelector("/fournisseurs")).toBe('[data-tour="nav-fournisseurs"]');
  });

  it("buildAppTourSteps inclut intro, modules accessibles et fin", () => {
    const admin = buildAppTourSteps("ADMIN");
    expect(admin[0].id).toBe("welcome");
    expect(admin[admin.length - 1].id).toBe("finish");
    expect(admin.some((s) => s.id === "page-dashboard")).toBe(false);
    expect(admin.some((s) => s.id === "nav-bi")).toBe(true);
    expect(admin.some((s) => s.id === "table-bi")).toBe(true);
    expect(admin.some((s) => s.id === "nav-fournisseurs")).toBe(true);
    expect(admin.some((s) => s.id === "table-fournisseurs")).toBe(true);
    expect(admin.some((s) => s.id === "search-fournisseurs")).toBe(true);
  });

  it("buildAppTourSteps respecte le rôle FINANCE", () => {
    const finance = buildAppTourSteps("FINANCE");
    expect(finance.some((s) => s.id === "nav-factures")).toBe(true);
    expect(finance.some((s) => s.id === "nav-fournisseurs")).toBe(false);
  });

  it("countTourSteps correspond à buildAppTourSteps", () => {
    expect(countTourSteps("STOCK")).toBe(buildAppTourSteps("STOCK").length);
  });
});
