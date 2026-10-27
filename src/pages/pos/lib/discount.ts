import { lineSumMinor, somToMinorOr0, sumLinesMinor } from '@/shared/lib/money'
import type { CartLine } from './types'

export type DiscountMode = 'pct' | 'sum'

/** Скидка на чек как ввёл кассир: процентом или суммой в сомах. */
export interface ReceiptDiscount {
  mode: DiscountMode
  /** Текст из поля; пусто - скидки нет. */
  value: string
}
export const NO_RECEIPT_DISCOUNT: ReceiptDiscount = { mode: 'pct', value: '' }

/** Процент из поля ввода в пределах 0-100; пусто и мусор дают 0. */
export function parseReceiptPct(input: string): number {
  return Math.min(100, Math.max(0, parseFloat(input.replace(',', '.')) || 0))
}

/** Скидка чека не распространяется на подарки и упаковку. */
function discountable(line: CartLine): boolean {
  return !line.isGift && !line.isPackaging
}

/** База скидки чека: платные строки после построчных скидок. */
function discountableMinor(cart: CartLine[]): number {
  return sumLinesMinor(cart.filter(discountable))
}

/** Процент от базы либо введённая сумма, но не больше базы. */
export function receiptDiscountMinor(cart: CartLine[], rd: ReceiptDiscount): number {
  const base = discountableMinor(cart)
  if (base <= 0) return 0
  const wanted =
    rd.mode === 'sum' ? somToMinorOr0(rd.value) : Math.round((base * parseReceiptPct(rd.value)) / 100)
  return Math.min(base, Math.max(0, wanted))
}

/**
 * Делит скидку чека по платным строкам методом наибольших остатков: сумма долей равна скидке,
 * итоги сходятся с бэком до тыйына.
 */
export function receiptDiscountShares(cart: CartLine[], rd: ReceiptDiscount): Map<string, number> {
  const shares = new Map<string, number>()
  const total = receiptDiscountMinor(cart, rd)
  const base = discountableMinor(cart)
  if (total <= 0 || base <= 0) return shares
  const rows = cart.filter(discountable).map((l) => {
    const sum = lineSumMinor(l.qty, l.priceMinor, l.discountMinor)
    const exact = (total * sum) / base
    return { lineId: l.lineId, sum, floor: Math.floor(exact), frac: exact - Math.floor(exact) }
  })
  let left = total - rows.reduce((s, r) => s + r.floor, 0)
  // остаток раздаём по тыйыну строкам с наибольшей дробной частью, при равенстве по порядку строк
  const order = rows.map((r, i) => ({ r, i })).sort((a, b) => b.r.frac - a.r.frac || a.i - b.i)
  for (const { r } of order) {
    if (left <= 0) break
    if (r.floor < r.sum) {
      r.floor += 1
      left -= 1
    }
  }
  rows.forEach((r) => shares.set(r.lineId, r.floor))
  return shares
}

/** Итог к оплате: построчные скидки, затем скидка на чек. */
export function receiptTotalMinor(cart: CartLine[], rd: ReceiptDiscount): number {
  return sumLinesMinor(cart) - receiptDiscountMinor(cart, rd)
}
