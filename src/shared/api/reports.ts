import { adminFetch, qs } from './core'
import type { ProductKind } from './kinds'

export interface DayRow {
  date: string
  revenueMinor: number
  costMinor: number
  profitMinor: number
  salesCount: number
}

export interface ProductReportRow {
  productId: string
  productName: string
  qty: string
  revenueMinor: number
  profitMinor: number
}

export interface SellerReportRow {
  login: string
  displayName: string | null
  revenueMinor: number
  salesCount: number
}

export interface KindReportRow {
  kind: ProductKind
  qty: string
  revenueMinor: number
  profitMinor: number
}

export interface ReportSummary {
  revenueMinor: number
  costMinor: number
  profitMinor: number
  salesCount: number
  perDay: DayRow[]
  topProducts: ProductReportRow[]
  perSeller: SellerReportRow[]
  perKind: KindReportRow[]
  /** Подарки за период: количество и списанная себестоимость, это расход на акции. */
  giftQty: string
  giftCostMinor: number
}

export function fetchReportSummary(from: string, to: string): Promise<ReportSummary> {
  return adminFetch(`/api/admin/reports/summary${qs({ from, to })}`)
}

export interface SellerStats {
  soldMinor: number
  salesCount: number
  daysWorked: number
}

/** За всё время: сумма продаж, число чеков и дней с продажами. */
export function fetchSellerStats(login: string): Promise<SellerStats> {
  return adminFetch(`/api/admin/reports/seller/${encodeURIComponent(login)}`)
}
