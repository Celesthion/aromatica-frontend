import { adminFetch, post, qs } from './core'
import type { PosProduct } from './pos'

export interface ReservationLine {
  productId: string
  productName: string
  qty: number
  priceMinor: number
  /** qty в карточке: сколько доступно для этой брони. */
  product: PosProduct
}

export interface Reservation {
  id: string
  customerName: string
  phone: string | null
  /** null: бронь только по имени и телефону. */
  counterpartyId: string | null
  comment: string | null
  expiresAt: string
  /** Срок вышел, товар больше не резервируется. */
  expired: boolean
  /** EXPIRED ставит сервер по расписанию; до этого у просроченной ACTIVE и expired = true. */
  status: 'ACTIVE' | 'EXPIRED' | 'SOLD' | 'CANCELLED'
  sumMinor: number
  lines: ReservationLine[]
}

export function fetchReservations(warehouseId?: string): Promise<Reservation[]> {
  return adminFetch(`/api/pos/reservations${qs({ warehouseId })}`)
}

export function createReservation(data: {
  warehouseId: string
  /** Обязателен: имя и телефон бэк берёт из карточки покупателя. */
  counterpartyId: string
  comment?: string | null
  /** Срок в днях; если не задан, берётся из настроек. */
  days?: number | null
  lines: { productId: string; qty: number; priceMinor: number }[]
}): Promise<Reservation> {
  return adminFetch('/api/pos/reservations', post(data))
}

export function cancelReservation(id: string): Promise<void> {
  return adminFetch(`/api/pos/reservations/${id}/cancel`, post())
}

export function extendReservation(id: string, days: number): Promise<Reservation> {
  return adminFetch(`/api/pos/reservations/${id}/extend`, post({ days }))
}
