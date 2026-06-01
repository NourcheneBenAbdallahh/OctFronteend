export const CONTRAT_STATUT_DEFAULT_NOTES: Record<string, string> = {
  ACTIF: "Contrat en cours — livraisons et commandes autorisées.",
  SUSPENDU: "Contrat suspendu — aucune nouvelle commande ne doit être passée.",
  EXPIRE: "Contrat expiré ou désactivé — conservé pour référence uniquement.",
};

export function getContratStatutNote(
  statut?: string | null,
  customNote?: string | null
): string {
  const custom = customNote?.trim();
  if (custom) return custom;
  if (!statut) return "";
  return CONTRAT_STATUT_DEFAULT_NOTES[statut] ?? "";
}

export function getContratStatus(contrat: {
  quantite_realisee?: number | null;
  quantite_contractuelle?: number | null;
}) {
  const realisee = Number(contrat.quantite_realisee ?? 0);
  const contractuelle = Number(contrat.quantite_contractuelle ?? 1);
  const progress = (realisee / contractuelle) * 100;

  if (realisee > contractuelle) {
    return {
      label: "Dépassement",
      color: "text-red-600",
    };
  }

  if (progress > 80) {
    return {
      label: "Presque atteint",
      color: "text-orange-500",
    };
  }

  return {
    label: "Normal",
    color: "text-green-600",
  };
}

export const getProgressColor = (percent: number) => {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-orange-500";
  return "bg-indigo-600";
};

export type ContratInsightFilter =
  | ""
  | "SURVEILLER"
  | "DEPASSEMENT"
  | "ECHEANCE_30"
  | "INACTIFS";

export type ContratDashboardStats = {
  total: number;
  actifs: number;
  suspendus: number;
  expires: number;
  aSurveiller: number;
  inactifs: number;
  totalContractuel: number;
  totalRealise: number;
  totalRestant: number;
  realisation: number;
  montantHtEngage: number;
  contratsAvecMontant: number;
  enDepassement: number;
  echeanceProche: number;
};

type ContratStatsRow = {
  statut?: string | null;
  quantite_contractuelle?: number | null;
  quantite_realisee?: number | null;
  montant_ht?: number | null;
  date_fin?: string | null;
};

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function isContratEnDepassement(row: ContratStatsRow): boolean {
  const contractuelle = Number(row.quantite_contractuelle ?? 0);
  const realisee = Number(row.quantite_realisee ?? 0);
  return realisee > contractuelle;
}

export function isContratASurveiller(row: ContratStatsRow): boolean {
  if ((row.statut ?? "ACTIF") !== "ACTIF") return false;
  const contractuelle = Number(row.quantite_contractuelle ?? 0);
  const realisee = Number(row.quantite_realisee ?? 0);
  if (contractuelle <= 0) return false;
  if (realisee > contractuelle) return true;
  return (realisee / contractuelle) * 100 >= 80;
}

export function isContratEcheanceProche(
  row: ContratStatsRow,
  referenceDate = startOfToday()
): boolean {
  if ((row.statut ?? "ACTIF") !== "ACTIF") return false;
  const fin = parseDateOnly(row.date_fin);
  if (!fin) return false;
  const in30Days = new Date(referenceDate);
  in30Days.setDate(in30Days.getDate() + 30);
  return fin >= referenceDate && fin <= in30Days;
}

export function isContratInactif(row: ContratStatsRow): boolean {
  const statut = row.statut ?? "ACTIF";
  return statut === "SUSPENDU" || statut === "EXPIRE";
}

export function matchesContratInsightFilter(
  row: ContratStatsRow,
  filter: ContratInsightFilter,
  referenceDate = startOfToday()
): boolean {
  if (!filter) return true;
  switch (filter) {
    case "SURVEILLER":
      return isContratASurveiller(row);
    case "DEPASSEMENT":
      return isContratEnDepassement(row);
    case "ECHEANCE_30":
      return isContratEcheanceProche(row, referenceDate);
    case "INACTIFS":
      return isContratInactif(row);
    default:
      return true;
  }
}

export function computeContratDashboardStats(rows: ContratStatsRow[]): ContratDashboardStats {
  const now = startOfToday();

  let actifs = 0;
  let suspendus = 0;
  let expires = 0;
  let aSurveiller = 0;
  let totalContractuel = 0;
  let totalRealise = 0;
  let montantHtEngage = 0;
  let contratsAvecMontant = 0;
  let enDepassement = 0;
  let echeanceProche = 0;

  for (const r of rows) {
    const statut = r.statut ?? "ACTIF";
    if (statut === "ACTIF") actifs += 1;
    else if (statut === "SUSPENDU") suspendus += 1;
    else expires += 1;

    const qC = Number(r.quantite_contractuelle ?? 0);
    const qR = Number(r.quantite_realisee ?? 0);
    totalContractuel += qC;
    totalRealise += qR;
    if (isContratEnDepassement(r)) enDepassement += 1;
    if (isContratASurveiller(r)) aSurveiller += 1;
    if (isContratEcheanceProche(r, now)) echeanceProche += 1;

    const ht = Number(r.montant_ht ?? 0);
    if (ht > 0) {
      montantHtEngage += ht;
      contratsAvecMontant += 1;
    }
  }

  const totalRestant = totalContractuel - totalRealise;
  const realisation =
    totalContractuel > 0 ? Math.round((totalRealise / totalContractuel) * 100) : 0;

  return {
    total: rows.length,
    actifs,
    suspendus,
    expires,
    aSurveiller,
    inactifs: suspendus + expires,
    totalContractuel,
    totalRealise,
    totalRestant,
    realisation,
    montantHtEngage,
    contratsAvecMontant,
    enDepassement,
    echeanceProche,
  };
}

export function matchesMontantHtRange(
  montantHt: number | null | undefined,
  min?: string,
  max?: string
): boolean {
  const value = Number(montantHt ?? 0);
  const minVal = min?.trim() ? Number(min) : null;
  const maxVal = max?.trim() ? Number(max) : null;
  if (minVal != null && !Number.isNaN(minVal) && value < minVal) return false;
  if (maxVal != null && !Number.isNaN(maxVal) && value > maxVal) return false;
  return true;
}
