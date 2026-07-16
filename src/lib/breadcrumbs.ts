export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const home: BreadcrumbItem = { label: "Tableau de bord", href: "/bi" };

function trail(page: string, href: string): BreadcrumbItem[] {
  return [home, { label: page, href }];
}

export const BREADCRUMBS = {
  commandes: trail("Commandes", "/commandes"),
  fournisseurs: trail("Fournisseurs", "/fournisseurs"),
  inventaire: trail("Inventaire", "/stock-inventaire"),
  unitesMesure: trail("Unités de mesure", "/unites-mesure"),
  users: trail("Utilisateurs", "/users"),
  factures: trail("Factures", "/factures"),
  bonLivraisons: trail("Bons de livraison", "/bon-livraisons"),
  emballages: trail("Emballages", "/emballages"),
  notifications: trail("Notifications", "/notifications"),
} as const satisfies Record<string, BreadcrumbItem[]>;
