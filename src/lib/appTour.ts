import {
  APP_MODULE_GROUPS,
  moduleAccessibleByUser,
  type AppModuleSection,
} from "@/lib/appOnboarding";

export type TourPopoverSide = "top" | "right" | "bottom" | "left";

export type AppTourStep = {
  id: string;
  /** Ouvre le sous-menu latéral correspondant avant de surligner le lien. */
  prepareNav?: string;
  /** Route à ouvrir avant de surligner l’élément (si différente de la page actuelle). */
  route?: string;
  /** Sélecteur CSS de la zone à mettre en avant. */
  element: string;
  /** Sélecteur de repli si le principal est absent. */
  fallbackElement?: string;
  /** Passer automatiquement si aucun élément trouvé. */
  optional?: boolean;
  title: string;
  description: string;
  side?: TourPopoverSide;
};

/** Identifiant stable pour data-tour (ex. /fournisseurs → fournisseurs). */
export function pathToTourSlug(path: string): string {
  if (!path || path === "/") return "bi";
  return path.replace(/^\//, "");
}

export function navTourSelector(path: string): string {
  return `[data-tour="nav-${pathToTourSlug(path)}"]`;
}

export function pageTableSelector(path: string): string {
  const slug = pathToTourSlug(path);
  return `[data-tour="page-${slug}-table"]`;
}

export function pageSearchSelector(path: string): string {
  const slug = pathToTourSlug(path);
  return `[data-tour="page-${slug}-search"]`;
}

export function pageActionsSelector(path: string): string {
  const slug = pathToTourSlug(path);
  return `[data-tour="page-${slug}-actions"]`;
}

function accessibleModules(role: string | undefined | null): AppModuleSection[] {
  const mods: AppModuleSection[] = [];
  for (const group of APP_MODULE_GROUPS) {
    for (const mod of group.modules) {
      if (mod.path && moduleAccessibleByUser(mod, role)) {
        mods.push(mod);
      }
    }
  }
  return mods;
}

/** Parcours interactif court : intro + un arrêt par module accessible. */
export function buildAppTourSteps(role: string | undefined | null): AppTourStep[] {
  const steps: AppTourStep[] = [
    {
      id: "welcome",
      element: '[data-tour="sidebar-menu"]',
      title: "Bienvenue sur OCT",
      description:
        "Ce guide rapide présente les modules disponibles selon votre rôle. Cliquez sur Suivant pour avancer.",
      side: "right",
    },
    {
      id: "header-notifications",
      element: '[data-tour="header-notifications"]',
      title: "Notifications",
      description: "Alertes métier en temps réel : stocks, validations, comptes.",
      side: "bottom",
    },
    {
      id: "header-profile",
      element: '[data-tour="header-profile"]',
      title: "Votre profil",
      description: "Informations personnelles, adresse et vérifications.",
      side: "bottom",
    },
  ];

  const modules = accessibleModules(role);

  for (const mod of modules) {
    if (!mod.path) continue;

    const slug = pathToTourSlug(mod.path);

    steps.push({
      id: `nav-${slug}`,
      prepareNav: mod.path,
      route: mod.path,
      element: navTourSelector(mod.path),
      fallbackElement: '[data-tour="page-content"]',
      optional: true,
      title: mod.title,
      description: mod.description,
      side: "right",
    });
  }

  steps.push({
    id: "finish",
    element: '[data-tour="sidebar-menu"]',
    title: "Visite terminée",
    description:
      "Vous connaissez maintenant les modules accessibles avec votre rôle. Bonne utilisation d'OCT.",
    side: "right",
  });

  return steps;
}

export function countTourSteps(role: string | undefined | null): number {
  return buildAppTourSteps(role).length;
}
