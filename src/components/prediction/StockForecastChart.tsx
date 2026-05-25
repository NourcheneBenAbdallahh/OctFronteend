"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { HistoryPoint, PredictionPoint } from "@/lib/prediction";

type Props = {
  history: HistoryPoint[];
  predictions: PredictionPoint[];
  unitLabel: string;
};

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function StockForecastChart({
  history,
  predictions,
  unitLabel,
}: Props) {
  const historyData = history.map((h) => ({
    date: formatDay(h.date),
    sortiesReelles: h.quantite,
    sortiesPrevues: null as number | null,
  }));

  const forecastData = predictions.map((p) => ({
    date: formatDay(p.date),
    sortiesReelles: null as number | null,
    sortiesPrevues: p.quantite_predite,
    min: p.borne_basse,
    max: p.borne_haute,
  }));

  const chartData = [...historyData.slice(-21), ...forecastData];

  const dividerDate =
    history.length > 0 ? formatDay(history[history.length - 1].date) : null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Courbe bleue : sorties déjà enregistrées. Courbe orange pointillée : sorties
        estimées pour les 7 prochains jours ({unitLabel}/jour).
      </p>
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              label={{
                value: `Sorties (${unitLabel})`,
                angle: -90,
                position: "insideLeft",
                style: { fill: "#94a3b8", fontSize: 11 },
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value, name) => {
                if (value === undefined || value === null) {
                  return ["—", ""];
                }
                const labels: Record<string, string> = {
                  sortiesReelles: "Sorties enregistrées",
                  sortiesPrevues: "Sorties prévues",
                };
                return [`${value} ${unitLabel}`, labels[String(name)] ?? String(name)];
              }}
            />
            <Legend
              verticalAlign="top"
              formatter={(value) =>
                value === "sortiesReelles"
                  ? "Passé (réel)"
                  : value === "sortiesPrevues"
                    ? "À venir (estimé)"
                    : value
              }
            />
            {dividerDate && (
              <ReferenceLine
                x={dividerDate}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: "Aujourd'hui →",
                  position: "top",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="sortiesReelles"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              name="sortiesReelles"
            />
            <Line
              type="monotone"
              dataKey="sortiesPrevues"
              stroke="#ea580c"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "#ea580c" }}
              connectNulls={false}
              name="sortiesPrevues"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
