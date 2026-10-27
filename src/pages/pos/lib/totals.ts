import { grossMinor, sumLinesMinor } from '@/shared/lib/money'
import { receiptTotalMinor, type ReceiptDiscount } from './discount'
import { cartRows } from './rows'
import type { CartLine } from './types'

export interface ReceiptTotals {
  /** Платные строки до всех скидок, без подарков. */
  subtotalMinor: number
  /** После построчных скидок; от неё считаются пороги акций. */
  totalMinor: number
  lineDiscountMinor: number
  /** Скидка на весь чек, поверх построчных. */
  receiptDiscountMinor: number
  payableMinor: number
  /** Считаем наборами, а не строками: набор из трёх позиций это один подарок. */
  giftCount: number
}

/**
 * Сначала построчные скидки, потом скидка на весь чек. Пороги акций считаем до скидки на чек,
 * чтобы она не отменяла уже выданный подарок.
 */
export function receiptTotals(cart: CartLine[], rd: ReceiptDiscount): ReceiptTotals {
  const subtotalMinor = cart.reduce((s, l) => s + (l.isGift ? 0 : grossMinor(l.qty, l.priceMinor)), 0)
  const totalMinor = sumLinesMinor(cart)
  const payableMinor = receiptTotalMinor(cart, rd)
  return {
    subtotalMinor,
    totalMinor,
    lineDiscountMinor: Math.max(0, subtotalMinor - totalMinor),
    receiptDiscountMinor: Math.max(0, totalMinor - payableMinor),
    payableMinor,
    giftCount: cartRows(cart).gifts.length,
  }
}
