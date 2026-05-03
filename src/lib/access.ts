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
  const bypass = [
    "/verify-email",
    "/reset-password",
  ];
  return bypass.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Page d’accueil par rôle si l’URL actuelle n’est pas autorisée (hors ADMIN). */
export function defaultHomePath(role: string | undefined | null): string {
  const r = toAccessRole(role);
  if (!r || r === "ADMIN") return "/";
  if (r === "LOGISTIQUE") return "/commandes";
  if (r === "FINANCE") return "/factures";
  return "/";
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

  if (path === "/" || path === "") {
    return r === "STOCK";
  }

  if (path.startsWith("/bi")) {
    return false;
  }

  if (
    DEMO_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
  ) {
    return false;
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
    return r === "STOCK";
  }

  if (path.startsWith("/commandes")) {
    return r === "LOGISTIQUE";
  }
  if (path.startsWith("/bon-livraisons")) {
    return r === "LOGISTIQUE";
  }
  if (path.startsWith("/factures")) {
    return r === "FINANCE";
  }

  return false;
}
