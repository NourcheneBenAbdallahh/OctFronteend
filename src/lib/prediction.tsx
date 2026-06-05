import { graphqlRequest, type GraphqlRequestOptions } from "@/lib/graphqlClient";

export interface PredictionPoint {
  date: string;
  quantite_predite: number;
  borne_basse: number;
  borne_haute: number;
  quantite_pte_estimee?: number;
}

export interface HistoryPoint {
  date: string;
  quantite: number;
  quantite_prd?: number;
  quantite_pte?: number;
}

export type AlertLevel = "STABLE" | "ATTENTION" | "URGENT" | "CRITIQUE";

export interface ForecastInsight {
  stock_actuel: number;
  min_stock: number;
  conso_moyenne_jour: number;
  conso_prd_moyenne_jour: number;
  conso_pte_moyenne_jour: number;
  commandes_en_cours: number;
  lead_time_jours: number;
  jours_avant_rupture: number;
  niveau_alerte: AlertLevel;
  message_agent: string;
  quantite_a_commander: number;
  history_days: number;
  entrepot_name?: string | null;
}

export interface ModelMetrics {
  safety_stock: number;
  volatility_sigma: number;
  confidence_level: string;
  method?: string;
  model_type?: string;
  weekly_seasonality?: boolean;
  yearly_seasonality?: boolean;
  reliability_score?: number;
  cap_applied?: boolean;
  cap_value?: number;
  coefficient_variation?: number;
  conso_prd_moyenne?: number;
  conso_pte_moyenne?: number;
  lead_time_days?: number;
}

export interface PredictDemandResponse {
  predictDemand: {
    emballage_id?: string;
    entrepot_id?: string | null;
    entrepot_name?: string | null;
    name: string;
    metrics: ModelMetrics;
    predictions: PredictionPoint[];
    history: HistoryPoint[];
    insight: ForecastInsight;
  };
}

const GET_STOCK_FORECAST = `
  query GetStockForecast($emballage_id: ID!, $entrepot_id: ID) {
    predictDemand(emballage_id: $emballage_id, entrepot_id: $entrepot_id) {
      emballage_id
      entrepot_id
      entrepot_name
      name
      metrics {
        safety_stock
        volatility_sigma
        confidence_level
        method
        model_type
        weekly_seasonality
        yearly_seasonality
        reliability_score
        cap_applied
        cap_value
        coefficient_variation
        conso_prd_moyenne
        conso_pte_moyenne
        lead_time_days
      }
      predictions {
        date
        quantite_predite
        borne_basse
        borne_haute
        quantite_pte_estimee
      }
      history {
        date
        quantite
        quantite_prd
        quantite_pte
      }
      insight {
        stock_actuel
        min_stock
        conso_moyenne_jour
        conso_prd_moyenne_jour
        conso_pte_moyenne_jour
        commandes_en_cours
        lead_time_jours
        jours_avant_rupture
        niveau_alerte
        message_agent
        quantite_a_commander
        history_days
        entrepot_name
      }
    }
  }
`;

export async function fetchStockForecast(emballageId: string, entrepotId?: string | null) {
  return await graphqlRequest<PredictDemandResponse>(GET_STOCK_FORECAST, {
    emballage_id: emballageId,
    entrepot_id: entrepotId || null,
  });
}

const SUBMIT_FORECAST_FEEDBACK = `
  mutation SubmitForecastFeedback($emballage_id: ID!, $helpful: Boolean!, $comment: String) {
    submitForecastFeedback(emballage_id: $emballage_id, helpful: $helpful, comment: $comment) {
      success
      message
    }
  }
`;

export async function submitForecastFeedback(
  emballageId: string,
  helpful: boolean,
  comment?: string,
  opts?: GraphqlRequestOptions
) {
  return graphqlRequest<{ submitForecastFeedback: { success: boolean; message: string } }>(
    SUBMIT_FORECAST_FEEDBACK,
    { emballage_id: emballageId, helpful, comment: comment || null },
    opts
  );
}

export function alertLevelLabel(level: AlertLevel): string {
  switch (level) {
    case "CRITIQUE":
      return "Agir tout de suite";
    case "URGENT":
      return "Commander bientôt";
    case "ATTENTION":
      return "À garder en tête";
    default:
      return "Rien à faire pour l'instant";
  }
}

/** Message court pour un agent terrain (sans jargon). */
export function alertLevelActionHint(level: AlertLevel): string {
  switch (level) {
    case "CRITIQUE":
      return "Le stock risque d'être épuisé très vite. Lancez une commande dès que possible.";
    case "URGENT":
      return "Prévoyez une commande dans les prochains jours pour éviter la rupture.";
    case "ATTENTION":
      return "Pas d'urgence, mais surveillez ce produit dans la semaine.";
    default:
      return "Votre stock couvre la consommation prévue. Aucune action nécessaire.";
  }
}

export function reliabilityPlainLabel(score?: number): string {
  if (score == null) return "—";
  if (score >= 80) return "Bonne";
  if (score >= 60) return "Correcte";
  return "Approximative";
}

export function modelTypeLabel(modelType?: string): string {
  switch (modelType) {
    case "moving_average":
      return "Calcul sur la moyenne récente";
    case "prophet":
      return "Calcul avec variations saisonnières";
    default:
      return "Calcul automatique";
  }
}

export function alertLevelStyles(level: AlertLevel): {
  banner: string;
  badge: string;
  border: string;
} {
  switch (level) {
    case "CRITIQUE":
      return {
        banner: "bg-red-50 border-red-200 text-red-900",
        badge: "bg-red-600 text-white",
        border: "border-red-500",
      };
    case "URGENT":
      return {
        banner: "bg-orange-50 border-orange-200 text-orange-900",
        badge: "bg-orange-600 text-white",
        border: "border-orange-500",
      };
    case "ATTENTION":
      return {
        banner: "bg-amber-50 border-amber-200 text-amber-900",
        badge: "bg-amber-500 text-white",
        border: "border-amber-500",
      };
    default:
      return {
        banner: "bg-emerald-50 border-emerald-200 text-emerald-900",
        badge: "bg-[#00A09D] text-white",
        border: "border-[#00A09D]",
      };
  }
}
