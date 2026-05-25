import { canAccessPath, canUseStockAi, type AccessRole } from "@/lib/access";

export type AppModuleSection = {
  id: string;
  title: string;
  description: string;
  path?: string;
  /** Rôles ayant accès à ce module (CONTRAT = logistique côté app). */
  roles: AccessRole[];
};

export type AppModuleGroup = {
  id: string;
  title: string;
  modules: AppModuleSection[];
};

/** Catalogue complet de l’application OCT — présenté à la première connexion. */
export const APP_MODULE_GROUPS: AppModuleGroup[] = [
  {
    id: "pilotage",
    title: "Pilotage & analyse",
    modules: [
      {
        id: "dashboard",
        title: "Tableau de bord",
        description:
          "Vue d’ensemble des indicateurs clés : stocks, alertes, activité récente et raccourcis vers vos modules.",
        path: "/",
        roles: ["ADMIN", "STOCK"],
      },
      {
        id: "bi",
        title: "Tableau BI",
        description:
          "Analyses avancées adaptées à votre rôle : consommation, logistique, finance ou vue globale pour l’administrateur.",
        path: "/bi",
        roles: ["ADMIN", "STOCK", "LOGISTIQUE", "FINANCE"],
      },
      {
        id: "prediction",
        title: "Prévisions stock",
        description:
          "Anticipation des ruptures et tendances de consommation par emballage grâce aux modèles prédictifs.",
        path: "/prediction",
        roles: ["ADMIN", "STOCK"],
      },
      {
        id: "calendar",
        title: "Calendrier",
        description:
          "Planning des commandes, livraisons et événements liés à votre activité.",
        path: "/calendar",
        roles: ["ADMIN", "STOCK", "LOGISTIQUE", "FINANCE"],
      },
    ],
  },
  {
    id: "referentiel",
    title: "Référentiel & partenaires",
    modules: [
      {
        id: "users",
        title: "Utilisateurs",
        description:
          "Gestion des comptes, rôles, activation et sécurité des accès à la plateforme.",
        path: "/users",
        roles: ["ADMIN"],
      },
      {
        id: "unites",
        title: "Unités de mesure",
        description:
          "Catalogue des unités (kg, L, pièce…) et conversions utilisées dans tout le système.",
        path: "/unites-mesure",
        roles: ["ADMIN"],
      },
      {
        id: "emballages",
        title: "Emballages",
        description:
          "Fiches produits emballages : références, dimensions, unités et paramètres de stock.",
        path: "/emballages",
        roles: ["ADMIN", "STOCK", "LOGISTIQUE"],
      },
      {
        id: "fournisseurs",
        title: "Fournisseurs",
        description:
          "Annuaire fournisseurs, coordonnées et carte géographique des partenaires.",
        path: "/fournisseurs",
        roles: ["ADMIN", "LOGISTIQUE"],
      },
      {
        id: "contrats",
        title: "Contrats",
        description:
          "Contrats fournisseurs, volumes, échéances et suivi des engagements.",
        path: "/contrats",
        roles: ["ADMIN", "LOGISTIQUE"],
      },
      {
        id: "entrepots",
        title: "Entrepôts",
        description:
          "Sites de stockage, capacités et organisation logistique.",
        path: "/entrepots",
        roles: ["ADMIN", "LOGISTIQUE"],
      },
    ],
  },
  {
    id: "stock",
    title: "Stock & inventaire",
    modules: [
      {
        id: "stocks",
        title: "Stocks",
        description:
          "Niveaux de stock par emballage et entrepôt, seuils et alertes.",
        path: "/stock",
        roles: ["ADMIN", "STOCK"],
      },
      {
        id: "inventaire",
        title: "Inventaire",
        description:
          "Campagnes d’inventaire, écarts, régularisations et historique des comptages.",
        path: "/stock-inventaire",
        roles: ["ADMIN", "STOCK"],
      },
      {
        id: "lots",
        title: "Lots",
        description:
          "Traçabilité par lot : réceptions, dates, quantités et affectation aux stocks.",
        path: "/lot",
        roles: ["ADMIN", "STOCK"],
      },
      {
        id: "mouvements",
        title: "Mouvements de stock",
        description:
          "Entrées, sorties, transferts et ajustements avec historique complet.",
        path: "/mouvements",
        roles: ["ADMIN", "STOCK"],
      },
    ],
  },
  {
    id: "commercial",
    title: "Commandes & facturation",
    modules: [
      {
        id: "commandes",
        title: "Commandes",
        description:
          "Création et suivi des commandes fournisseurs, statuts et lignes détaillées.",
        path: "/commandes",
        roles: ["ADMIN", "LOGISTIQUE"],
      },
      {
        id: "bl",
        title: "Bons de livraison",
        description:
          "Réception des livraisons, justificatifs, liaison aux commandes et lots.",
        path: "/bon-livraisons",
        roles: ["ADMIN", "LOGISTIQUE", "FINANCE"],
      },
      {
        id: "factures",
        title: "Factures",
        description:
          "Facturation à partir des BL, validation et suivi des paiements.",
        path: "/factures",
        roles: ["ADMIN", "FINANCE"],
      },
    ],
  },
  {
    id: "outils",
    title: "Outils transverses",
    modules: [
      {
        id: "notifications",
        title: "Notifications",
        description:
          "Alertes métier en temps réel : stocks critiques, nouveaux comptes, validations, etc.",
        path: "/notifications",
        roles: ["ADMIN", "STOCK", "LOGISTIQUE", "FINANCE"],
      },
      {
        id: "profile",
        title: "Profil",
        description:
          "Informations personnelles, photo, téléphone et vérification de l’email.",
        path: "/profile",
        roles: ["ADMIN", "STOCK", "LOGISTIQUE", "FINANCE"],
      },
      {
        id: "chatbot",
        title: "Assistant IA stock",
        description:
          "Posez des questions en langage naturel sur les stocks, emballages et mouvements.",
        roles: ["ADMIN", "STOCK"],
      },
    ],
  },
];

export function roleLabel(role: string): string {
  const r = role.trim().toUpperCase();
  const labels: Record<string, string> = {
    ADMIN: "Administrateur",
    STOCK: "Stock",
    LOGISTIQUE: "Logistique",
    CONTRAT: "Contrats (logistique)",
    FINANCE: "Finance",
  };
  return labels[r] ?? role;
}

export function moduleAccessibleByUser(
  module: AppModuleSection,
  role: string | undefined | null
): boolean {
  if (module.id === "chatbot") return canUseStockAi(role);
  if (!module.path) return false;
  return canAccessPath(module.path, role);
}

export function countAccessibleModules(role: string | undefined | null): number {
  let n = 0;
  for (const group of APP_MODULE_GROUPS) {
    for (const mod of group.modules) {
      if (moduleAccessibleByUser(mod, role)) n += 1;
    }
  }
  return n;
}

export type OnboardingWelcomeStep = {
  kind: "welcome";
};

export type OnboardingModuleStep = {
  kind: "module";
  groupTitle: string;
  module: AppModuleSection;
};

export type OnboardingFinishStep = {
  kind: "finish";
};

export type OnboardingStep =
  | OnboardingWelcomeStep
  | OnboardingModuleStep
  | OnboardingFinishStep;

/** Étapes du guide pas à pas : intro → chaque module → conclusion. */
export function buildOnboardingSteps(): OnboardingStep[] {
  const steps: OnboardingStep[] = [{ kind: "welcome" }];
  for (const group of APP_MODULE_GROUPS) {
    for (const mod of group.modules) {
      steps.push({ kind: "module", groupTitle: group.title, module: mod });
    }
  }
  steps.push({ kind: "finish" });
  return steps;
}

export function countModuleSteps(): number {
  return APP_MODULE_GROUPS.reduce((n, g) => n + g.modules.length, 0);
}
