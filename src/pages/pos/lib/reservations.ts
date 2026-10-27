import type { Reservation } from '@/shared/api'
import { lineSumMinor, unitPriceMinor } from '@/shared/lib/money'
import { newUuid } from '@/shared/lib/uuid'
import { receiptDiscountShares, type ReceiptDiscount } from './discount'
import type { CartLine } from './types'

/**
 * Срок брони из поля формы: пусто, мусор и ноль дают defaultDays, лишнее срезается до maxDays
 * (как effectiveDays на бэке).
 */
export function normalizeReservationDays(input: string, defaultDays: number, maxDays: number): number {
  const n = Math.trunc(Number(input))
  const base = Number.isFinite(n) && n > 0 ? n : defaultDays
  return Math.max(1, Math.min(base, maxDays))
}

interface ReservationLineDraft {
  productId: string
  qty: number
  priceMinor: number
}

/**
 * Подарки не бронируем (акция относится к чеку). Цена фиксируется со всеми скидками, чтобы при
 * выкупе покупатель заплатил названную сумму.
 */
export function reservationLines(cart: CartLine[], rd: ReceiptDiscount): ReservationLineDraft[] {
  const shares = receiptDiscountShares(cart, rd)
  return cart
    .filter((l) => !l.isGift)
    .map((l) => ({
      productId: l.product.id,
      qty: l.qty,
      priceMinor: unitPriceMinor(l.qty, l.priceMinor, l.discountMinor + (shares.get(l.lineId) ?? 0)),
    }))
}

export function reservationSumMinor(lines: ReservationLineDraft[]): number {
  return lines.reduce((s, l) => s + lineSumMinor(l.qty, l.priceMinor, 0), 0)
}

/** Строки брони для чека по зафиксированным ценам (кнопка "Продать"). */
export function reservationToCart(r: Reservation): CartLine[] {
  return r.lines.map((l) => ({
    lineId: newUuid(),
    product: l.product,
    qty: l.qty,
    priceMinor: l.priceMinor,
    discountMinor: 0,
    isGift: false,
  }))
}

/** Для подписи "осталось N дн.", не меньше нуля. */
export function daysLeft(expiresAt: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86_400_000))
}
