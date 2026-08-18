import { supabase } from "@/integrations/supabase/client";

export type ErpMetrics = {
  year: number;
  month: number;
  gross_sales: number;
  net_sales: number;
  cogs: number;
  gross_profit: number;
  courier_cost: number;
  packaging_cost: number;
  order_other_cost: number;
  payment_fees: number;
  operating_expenses: number;
  net_profit: number;
  purchase_total: number;
  cash_received: number;
  cod_pending: number;
  stock_value: number;
  delivered_orders: number;
  units_sold: number;
  low_stock_count: number;
};

export const EMPTY_METRICS: ErpMetrics = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  gross_sales: 0,
  net_sales: 0,
  cogs: 0,
  gross_profit: 0,
  courier_cost: 0,
  packaging_cost: 0,
  order_other_cost: 0,
  payment_fees: 0,
  operating_expenses: 0,
  net_profit: 0,
  purchase_total: 0,
  cash_received: 0,
  cod_pending: 0,
  stock_value: 0,
  delivered_orders: 0,
  units_sold: 0,
  low_stock_count: 0,
};

export const EXPENSE_CATEGORIES = [
  "ads_marketing",
  "packaging",
  "courier_extra",
  "content_photography",
  "rent_utility",
  "staff_helper",
  "internet_software",
  "damage_loss",
  "refund_return",
  "transport",
  "miscellaneous",
] as const;

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthParts(value: string) {
  const parts = value.split("-").map(Number);
  return { year: parts[0] ?? new Date().getFullYear(), month: parts[1] ?? 1 };
}

export function monthRange(value: string) {
  const { year, month } = monthParts(value);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startDate: `${year}-${String(month).padStart(2, "0")}-01`,
    endDate: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-01`,
  };
}

export function monthLabel(value: string) {
  const { year, month } = monthParts(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function money(value: number | string, symbol = "৳") {
  return `${symbol}${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

export async function fetchErpMetrics(value: string): Promise<ErpMetrics> {
  const { year, month } = monthParts(value);
  const { data, error } = await (supabase as any).rpc("erp_month_metrics", {
    p_year: year,
    p_month: month,
  });
  if (error) throw error;
  return { ...EMPTY_METRICS, ...(data || {}) } as ErpMetrics;
}

export function prettyKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
