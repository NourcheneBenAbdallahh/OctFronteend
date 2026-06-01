/**
 * Rôles fonctionnels alignés avec l’ENUM backend (users.role).
 * CONTRAT est traité comme LOGISTIQUE pour le menu et les garde-frontières UX.
 */

export type AccessRole = "ADMIN" | "STOCK" | "LOGISTIQUE" | "FINANCE";

export function canUseStockAi(role: string | undefined | null): boolean {
  const r = toAccessRole(role);
  return r === "ADMIN" || r === "STOCK";
}

const DEMO_PREFIXES = [
  "/videos",
  "/badge",
  "/buttons",
  "/images",
  "/modals",
  "/avatars",
  "/alerts",
  "/line-chart",
  "/bar-chart",
  "/basic-tables",
  "/form-elements",
  "/blank",
] as const;

export function toAccessRole(
  role: string | undefined | null
): AccessRole | null {
  if (!role) return null;
  const u = role.trim().toUpperCase();
  if (u === "CONTRAT") return "LOGISTIQUE";
  if (u === "ADMIN" || u === "STOCK" || u === "LOGISTIQUE" || u === "FINANCE") {
    return u;
  }
  return null;
}

export function shouldBypassRouteAccess(pathname: string): boolean {
  const path = pathname.split("?")[0] || "";
  const bypass = ["/verify-email"];
  return bypass.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Page d’accueil par rôle si l’URL actuelle n’est pas autorisée (hors ADMIN). */
export function defaultHomePath(role: string | undefined | null): string {
  const r = toAccessRole(role);
  if (!r || r === "ADMIN" || r === "STOCK") return "/bi";
  if (r === "LOGISTIQUE") return "/commandes";
  if (r === "FINANCE") return "/factures";
  return "/bi";
}

export function canAccessPath(
  pathname: string,
  role: string | undefined | null
): boolean {
  const pathRaw = pathname.split("?")[0] || "/";
  const path =
    pathRaw !== "" && !pathRaw.startsWith("/") ? `/${pathRaw}` : pathRaw;

  if (shouldBypassRouteAccess(path)) return true;

  const r = toAccessRole(role);
  if (!r) return false;
  if (r === "ADMIN") return true;

  if (
    path === "/notifications" ||
    path.startsWith("/notifications/")
  ) {
    return true;
  }
  if (path === "/profile" || path.startsWith("/profile/")) {
    return true;
  }
  if (path === "/calendar" || path.startsWith("/calendar/")) {
    return true;
  }

  if (path === "/bi" || path.startsWith("/bi/")) {
    return true;
  }

  if (
    DEMO_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
  ) {
    return false;
  }

  if (path.startsWith("/unites-mesure")) {
    return isAdminUser(role);
  }

  if (path.startsWith("/emballages")) {
    return r === "STOCK" || r === "LOGISTIQUE";
  }
  if (path.startsWith("/fournisseurs")) {
    return r === "LOGISTIQUE";
  }
  if (path.startsWith("/contrats")) {
    return r === "LOGISTIQUE";
  }
  if (path.startsWith("/entrepots")) {
    return r === "LOGISTIQUE";
  }

  if (
    path.startsWith("/stock-inventaire") ||
    path === "/stock" ||
    path.startsWith("/stock/")
  ) {
    return r === "STOCK";
  }
  if (path.startsWith("/lot")) {
    return r === "STOCK";
  }
  if (path.startsWith("/mouvements")) {
    return r === "STOCK";
  }
  if (path.startsWith("/prediction")) {
    return canUseStockAi(role);
  }

  if (path.startsWith("/commandes")) {
    return r === "LOGISTIQUE";
  }
  if (path.startsWith("/bon-livraisons")) {
    return r === "LOGISTIQUE" || r === "FINANCE";
  }
  if (path.startsWith("/factures")) {
    return r === "FINANCE";
  }

  return false;
}

/** Voir tous les mouvements / événements (calendrier) ; les autres utilisateurs ont une vue filtrée. */
export function isAdminUser(role: string | undefined | null): boolean {
  return (role ?? "").trim().toUpperCase() === "ADMIN";
}

/** Catalogue emballages : lecture STOCK + LOGISTIQUE ; création / édition réservées à la logistique (et ADMIN côté API). */
export function canManageEmballagesCatalog(role: string | undefined | null): boolean {
  if (isAdminUser(role)) return true;
  return toAccessRole(role) === "LOGISTIQUE";
}

function isStockSectionUser(role: string | undefined | null): boolean {
  return toAccessRole(role) === "STOCK";
}

function isLogistiqueSectionUser(role: string | undefined | null): boolean {
  return toAccessRole(role) === "LOGISTIQUE";
}

export function filterStocksForDashboardUser<T extends { user_id?: string | number | null }>(
  stocks: T[],
  userId: string | undefined | null,
  role: string | undefined | null
): T[] {
  if (isAdminUser(role) || isStockSectionUser(role)) return stocks;
  if (!userId) return [];
  return stocks.filter((s) => String(s.user_id ?? "") === String(userId));
}

export function filterCommandesForCalendarUser<
  T extends { created_by?: string | number | null },
>(commandes: T[], userId: string | undefined | null, role: string | undefined | null): T[] {
  if (isAdminUser(role) || isLogistiqueSectionUser(role)) return commandes;
  if (!userId) return [];
  return commandes.filter((c) => String(c.created_by ?? "") === String(userId));
}

/**
 * Aligné sur `commandes` GraphQL (@requiresRole LOGISTIQUE) : ADMIN court-circuité côté API,
 * CONTRAT traité comme LOGISTIQUE. FINANCE / STOCK n’ont pas accès à la liste commandes.
 */
export function canQueryCommandesList(role: string | undefined | null): boolean {
  if (isAdminUser(role)) return true;
  return toAccessRole(role) === "LOGISTIQUE";
}

/** Création / modification / annulation commande (GraphQL mutations commandes). */
export function canManageCommandes(role: string | undefined | null): boolean {
  return canQueryCommandesList(role);
}

/**
 * Liste / détail BL (GraphQL `bonLivraisons`, `bonLivraison`) : LOGISTIQUE + FINANCE (+ ADMIN).
 */
export function canQueryBonLivraisonsList(
  role: string | undefined | null
): boolean {
  if (isAdminUser(role)) return true;
  const r = toAccessRole(role);
  return r === "LOGISTIQUE" || r === "FINANCE";
}

/** Création / édition / annulation BL : LOGISTIQUE (+ ADMIN) uniquement. */
export function canManageBonLivraisons(
  role: string | undefined | null
): boolean {
  if (isAdminUser(role)) return true;
  return toAccessRole(role) === "LOGISTIQUE";
}

/** Domaine de données du tableau BI : chaque rôle a sa vue métier. */
export type BiDataScope = "full" | "stock" | "logistique" | "finance";

export function biDataScopeForRole(role: string | undefined | null): BiDataScope {
  const r = toAccessRole(role);
  if (r === "ADMIN") return "full";
  if (r === "STOCK") return "stock";
  if (r === "LOGISTIQUE") return "logistique";
  if (r === "FINANCE") return "finance";
  return "full";
}

/** Alertes prédictives (consommation par emballage) : dashboard et BI stock. */
export function canViewPredictiveStockAlerts(
  role: string | undefined | null
): boolean {
  const scope = biDataScopeForRole(role);
  return scope === "full" || scope === "stock";
}

/** Liste fournisseurs (page `/fournisseurs`) : ADMIN + LOGISTIQUE (+ CONTRAT). */
export function canViewFournisseursList(
  role: string | undefined | null
): boolean {
  return canAccessPath("/fournisseurs", role);
}

/** Carte géolocalisée : même périmètre que la liste fournisseurs. */
export function canViewFournisseursMap(
  role: string | undefined | null
): boolean {
  return canViewFournisseursList(role);
}

/** Libellé menu latéral pour la route `/bi`. */
export function sidebarBiNavLabel(role: string | undefined | null): string {
  switch (biDataScopeForRole(role)) {
    case "stock":
      return "BI — Stock";
    case "logistique":
      return "BI — Logistique";
    case "finance":
      return "BI — Finance";
    default:
      return "Tableau BI";
  }
}
