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

/** Identifiant stable pour data-tour (ex. /fournisseurs → fournisseurs, / → dashboard). */
export function pathToTourSlug(path: string): string {
  if (!path || path === "/") return "dashboard";
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

/** Parcours interactif : menu → écran → tableau → recherche → actions, pour chaque module accessible. */
export function buildAppTourSteps(role: string | undefined | null): AppTourStep[] {
  const steps: AppTourStep[] = [
    {
      id: "welcome",
      element: '[data-tour="sidebar-menu"]',
      title: "Bienvenue sur OCT",
      description:
        "Ce guide pas à pas vous montre l’application en direct : à chaque étape, la zone utile est surlignée. Cliquez sur Suivant pour continuer.",
      side: "right",
    },
    {
      id: "header-notifications",
      element: '[data-tour="header-notifications"]',
      title: "Notifications",
      description:
        "Les alertes métier (stocks, validations, comptes) apparaissent ici en temps réel.",
      side: "bottom",
    },
    {
      id: "header-profile",
      element: '[data-tour="header-profile"]',
      title: "Votre profil",
      description:
        "Accédez à vos informations, à la vérification email/téléphone et aux paramètres du compte.",
      side: "bottom",
    },
  ];

  const modules = accessibleModules(role);

  for (const mod of modules) {
    if (!mod.path || mod.path === "/") continue;

    const slug = pathToTourSlug(mod.path);

    steps.push({
      id: `nav-${slug}`,
      prepareNav: mod.path,
      element: navTourSelector(mod.path),
      title: `Menu — ${mod.title}`,
      description: `Dans le menu latéral, ouvrez le module « ${mod.title} ». Au clic sur Suivant, l’application affiche cet écran.`,
      side: "right",
    });

    const isBi = mod.path === "/bi";
    steps.push({
      id: `table-${slug}`,
      route: mod.path,
      element: pageTableSelector(mod.path),
      fallbackElement: '[data-tour="page-content"]',
      title: isBi ? `${mod.title} — indicateurs` : `${mod.title} — tableau`,
      description: isBi
        ? "KPIs, graphiques et synthèses selon votre rôle : consommation stock, pipeline commandes ou facturation."
        : "Ici vous voyez la liste principale : lignes, statuts, pagination et actions sur chaque enregistrement.",
      side: "top",
    });

    steps.push({
      id: `search-${slug}`,
      route: mod.path,
      element: pageSearchSelector(mod.path),
      optional: true,
      title: isBi ? `${mod.title} — période` : `${mod.title} — recherche`,
      description: isBi
        ? "Choisissez la fenêtre d’analyse (7 jours à 12 mois) pour recalculer tous les indicateurs."
        : "Tapez ici pour filtrer la liste en temps réel (nom, référence, partenaire…).",
      side: "bottom",
    });

    steps.push({
      id: `actions-${slug}`,
      route: mod.path,
      element: pageActionsSelector(mod.path),
      optional: true,
      title: isBi ? `${mod.title} — export` : `${mod.title} — actions`,
      description: isBi
        ? "Exportez la synthèse BI au format PDF pour partage ou archivage."
        : "Utilisez ce bouton pour créer un nouvel enregistrement ou lancer l’action principale du module.",
      side: "left",
    });
  }

  steps.push({
    id: "finish",
    element: '[data-tour="sidebar-menu"]',
    title: "Visite terminée",
    description:
      "Vous avez parcouru les zones essentielles d’OCT. Le menu ne montre que les modules accessibles avec votre rôle.",
    side: "right",
  });

  return steps;
}

export function countTourSteps(role: string | undefined | null): number {
  return buildAppTourSteps(role).length;
}
