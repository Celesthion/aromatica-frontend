import { adminFetch, put } from './core'

/** Настройки кассы, их меняет администратор. */
export interface PosSettings {
  reservationDefaultDays: number
  reservationMaxDays: number
  maxSellerDiscountPct: number
  /** Доля масла в разливе по умолчанию, в процентах; продавец может поменять при продаже. */
  defaultDilutionPct: number
}

export function fetchPosSettings(): Promise<PosSettings> {
  return adminFetch('/api/pos/settings')
}

/**
 * Только ADMIN. Ключи: reservation.default_days, reservation.max_days,
 * pos.max_seller_discount_pct, pos.default_dilution_pct.
 */
export function updateSetting(key: string, value: number): Promise<PosSettings> {
  // бэк принимает значение строкой
  return adminFetch('/api/admin/settings', put({ key, value: String(value) }))
}
