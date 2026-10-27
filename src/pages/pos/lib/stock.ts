import type { PosProduct } from '@/shared/api'
import type { CartLine } from './types'

/**
 * Остаток минус то, что уже заняли другие строки того же товара, включая подарки.
 * `exceptLineId` - строка, которую сейчас правим, её не считаем.
 */
export function remainingQty(cart: CartLine[], product: PosProduct, exceptLineId?: string): number {
  const taken = cart.reduce(
    (s, l) => (l.product.id === product.id && l.lineId !== exceptLineId ? s + l.qty : s),
    0,
  )
  return Math.max(0, product.qty - taken)
}

export interface StockShortage {
  product: PosProduct
  needed: number
  available: number
  short: number
}

/**
 * Позиции, которых в чеке больше, чем на складе, с количествами. Строки одного товара
 * суммируются, включая подарки.
 */
export function stockShortages(cart: CartLine[]): StockShortage[] {
  const need = new Map<string, { product: PosProduct; qty: number }>()
  cart.forEach((l) => {
    const cur = need.get(l.product.id)
    if (cur) cur.qty += l.qty
    else need.set(l.product.id, { product: l.product, qty: l.qty })
  })
  return [...need.values()]
    .filter((x) => x.qty > x.product.qty)
    .map((x) => ({
      product: x.product,
      needed: x.qty,
      available: x.product.qty,
      short: x.qty - x.product.qty,
    }))
}
