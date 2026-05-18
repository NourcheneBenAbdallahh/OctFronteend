import { graphqlRequest } from '@/lib/graphqlClient';
export interface PredictionPoint {
  date: string;
  quantite_predite: number;
  borne_basse: number;
  borne_haute: number;
}

export interface PredictDemandResponse {
  predictDemand: {
    name: string;
    metrics: {
      safety_stock: number;
      volatility_sigma: number;
      confidence_level: string;
    };
    predictions: PredictionPoint[];
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
      }
      predictions {
        date
        quantite_predite
        borne_basse
        borne_haute
      }
    }
  }
`;
export async function fetchStockForecast(emballageId: string) {
  return await graphqlRequest<PredictDemandResponse>(GET_STOCK_FORECAST, {
    emballage_id: emballageId
  });
}

