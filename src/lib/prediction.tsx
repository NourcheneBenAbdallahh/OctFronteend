import { graphqlRequest } from "@/lib/graphqlClient";

export interface PredictionPoint {
  date: string;
  quantite_predite: number;
  borne_basse: number;
  borne_haute: number;
}

export interface HistoryPoint {
  date: string;
  quantite: number;
}

export type AlertLevel = "STABLE" | "ATTENTION" | "CRITIQUE";

export interface ForecastInsight {
  stock_actuel: number;
  min_stock: number;
  conso_moyenne_jour: number;
  jours_avant_rupture: number;
  niveau_alerte: AlertLevel;
  message_agent: string;
  quantite_a_commander: number;
  history_days: number;
}

export interface PredictDemandResponse {
  predictDemand: {
    name: string;
    metrics: {
      safety_stock: number;
      volatility_sigma: number;
      confidence_level: string;
      method?: string;
    };
    predictions: PredictionPoint[];
    history: HistoryPoint[];
    insight: ForecastInsight;
  };
}

const GET_STOCK_FORECAST = `
  query GetStockForecast($emballage_id: ID!) {
    predictDemand(emballage_id: $emballage_id) {
      name
      metrics {
        safety_stock
        volatility_sigma
        confidence_level
        method
      }
      predictions {
        date
        quantite_predite
        borne_basse
        borne_haute
      }
      history {
        date
        quantite
      }
      insight {
        stock_actuel
        min_stock
        conso_moyenne_jour
        jours_avant_rupture
        niveau_alerte
        message_agent
        quantite_a_commander
        history_days
      }
    }
  }
`;

export async function fetchStockForecast(emballageId: string) {
  return await graphqlRequest<PredictDemandResponse>(GET_STOCK_FORECAST, {
    emballage_id: emballageId,
  });
}

export function alertLevelLabel(level: AlertLevel): string {
  switch (level) {
    case "CRITIQUE":
      return "Urgent — agir maintenant";
    case "ATTENTION":
      return "À surveiller";
    default:
      return "Situation normale";
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
