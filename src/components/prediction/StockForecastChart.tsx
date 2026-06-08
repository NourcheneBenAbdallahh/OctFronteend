"use client";

import {
  ComposedChart,
  Line,
  Area,
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
  const recentAvg =
    history.length > 0
      ? history.slice(-30).reduce((s, h) => s + h.quantite, 0) /
        Math.min(30, history.length)
      : null;

  const historyData = history.map((h) => ({
    date: formatDay(h.date),
    sortiesReelles: h.quantite,
    sortiesPrevues: null as number | null,
    min: null as number | null,
    max: null as number | null,
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
        <strong>Ligne bleue</strong> : ce qui est déjà sorti du stock.{" "}
        <strong>Ligne orange</strong> : estimation pour les 7 prochains jours.
        {recentAvg != null && (
          <>
            {" "}
            La ligne grise pointillée = moyenne des dernières sorties (
            {Math.round(recentAvg)} {unitLabel}/jour).
          </>
        )}
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
                value: `${unitLabel} / jour`,
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
                  sortiesReelles: "Déjà sorti",
                  sortiesPrevues: "Estimation",
                  min: "Minimum possible",
                  max: "Maximum possible",
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
                    ? "À venir (estimation)"
                    : value
              }
            />
            {recentAvg != null && (
              <ReferenceLine
                y={recentAvg}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: "Moyenne récente",
                  position: "insideTopRight",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
            )}
            {dividerDate && (
              <ReferenceLine
                x={dividerDate}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: "Aujourd'hui",
                  position: "top",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="max"
              stroke="none"
              fill="#fed7aa"
              fillOpacity={0.35}
              connectNulls={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
              connectNulls={false}
              legendType="none"
            />
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
