import { describe, expect, it } from "vitest";
import {
  APP_MODULE_GROUPS,
  buildOnboardingSteps,
  countAccessibleModules,
  countModuleSteps,
  moduleAccessibleByUser,
  roleLabel,
} from "./appOnboarding";

describe("appOnboarding", () => {
  it("décrit tous les groupes de modules", () => {
    expect(APP_MODULE_GROUPS.length).toBeGreaterThanOrEqual(4);
    const ids = APP_MODULE_GROUPS.flatMap((g) => g.modules.map((m) => m.id));
    expect(ids).toContain("commandes");
    expect(ids).toContain("factures");
    expect(ids).toContain("chatbot");
  });

  it("roleLabel traduit les rôles", () => {
    expect(roleLabel("ADMIN")).toBe("Administrateur");
    expect(roleLabel("CONTRAT")).toContain("logistique");
  });

  it("moduleAccessibleByUser respecte access.ts", () => {
    expect(moduleAccessibleByUser(
      { id: "factures", title: "", description: "", path: "/factures", roles: ["FINANCE"] },
      "FINANCE"
    )).toBe(true);
    expect(moduleAccessibleByUser(
      { id: "factures", title: "", description: "", path: "/factures", roles: ["FINANCE"] },
      "STOCK"
    )).toBe(false);
    expect(moduleAccessibleByUser(
      { id: "chatbot", title: "", description: "", roles: ["ADMIN"] },
      "STOCK"
    )).toBe(true);
  });

  it("countAccessibleModules compte les modules du rôle", () => {
    expect(countAccessibleModules("ADMIN")).toBeGreaterThan(
      countAccessibleModules("FINANCE")
    );
    expect(countAccessibleModules("FINANCE")).toBeGreaterThan(0);
  });

  it("buildOnboardingSteps produit un parcours pas à pas", () => {
    const steps = buildOnboardingSteps();
    expect(steps[0].kind).toBe("welcome");
    expect(steps[steps.length - 1].kind).toBe("finish");
    const moduleSteps = steps.filter((s) => s.kind === "module");
    expect(moduleSteps.length).toBe(countModuleSteps());
  });
});
