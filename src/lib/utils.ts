export const formatDate = (v?: string | null) => v ? (v.includes("T") ? v.split("T")[0] : v) : "-";

export const formatMoney = (v?: number | null) => v?.toLocaleString('fr-TN', { minimumFractionDigits: 3 }) || "0,000";

export const formatNumber = (v?: number | null) => v?.toLocaleString('fr-TN') || "0";

export const formatPercent = (v?: number | null) => v ? `${v.toFixed(1)}%` : "0%";
