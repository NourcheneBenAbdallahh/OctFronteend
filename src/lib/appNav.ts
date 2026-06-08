import { canAccessPath, sidebarBiNavLabel } from "@/lib/access";

export type AppNavSearchItem = {
  name: string;
  path: string;
  group?: string;
  keywords?: string[];
};

const APP_NAV_SEARCH_ITEMS: AppNavSearchItem[] = [
  { name: "Tableau BI", path: "/bi", group: "Navigation", keywords: ["bi", "dashboard", "tableau de bord"] },
  { name: "Utilisateurs", path: "/users", group: "Administration", keywords: ["users", "comptes"] },
  {
    name: "Unités de mesure",
    path: "/unites-mesure",
    group: "Administration",
    keywords: ["unite", "mesure", "kg", "litre"],
  },
  { name: "Emballages", path: "/emballages", group: "Catalogue", keywords: ["emballage", "packaging"] },
  { name: "Fournisseurs", path: "/fournisseurs", group: "Catalogue", keywords: ["fournisseur", "supplier"] },
  { name: "Contrats", path: "/contrats", group: "Catalogue", keywords: ["contrat", "contract"] },
  { name: "Entrepôts", path: "/entrepots", group: "Catalogue", keywords: ["entrepot", "warehouse", "depot"] },
  { name: "Stocks", path: "/stock", group: "Stocks", keywords: ["stock", "inventaire physique"] },
  { name: "Mouvements", path: "/mouvements", group: "Stocks", keywords: ["mouvement", "entree", "sortie"] },
  { name: "Lots", path: "/lot", group: "Stocks", keywords: ["lot", "batch"] },
  {
    name: "Inventaire",
    path: "/stock-inventaire",
    group: "Stocks",
    keywords: ["inventaire", "comptage", "ecart", "audit"],
  },
  { name: "Commandes", path: "/commandes", group: "Achats", keywords: ["commande", "order", "achat"] },
  {
    name: "Bons de livraison",
    path: "/bon-livraisons",
    group: "Achats",
    keywords: ["bon", "livraison", "bl", "reception"],
  },
  { name: "Factures", path: "/factures", group: "Finance", keywords: ["facture", "invoice", "paiement"] },
  { name: "Calendrier", path: "/calendar", group: "Navigation", keywords: ["calendar", "planning", "evenement"] },
  {
    name: "Prévisions stock",
    path: "/prediction",
    group: "Stocks",
    keywords: ["prediction", "prevision", "ia", "forecast"],
  },
  { name: "Mon profil", path: "/profile", group: "Compte", keywords: ["profil", "compte", "parametres"] },
  {
    name: "Notifications",
    path: "/notifications",
    group: "Compte",
    keywords: ["notification", "alerte", "message"],
  },
];

export function searchableNavForRole(
  role: string | undefined | null
): AppNavSearchItem[] {
  return APP_NAV_SEARCH_ITEMS.filter((item) => canAccessPath(item.path, role)).map(
    (item) =>
      item.path === "/bi"
        ? { ...item, name: sidebarBiNavLabel(role) }
        : item
  );
}

export function filterNavSearchItems(
  items: AppNavSearchItem[],
  query: string
): AppNavSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const haystack = [
      item.name,
      item.group ?? "",
      item.path,
      ...(item.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
