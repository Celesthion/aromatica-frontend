import type { PosGiftRule, PosProduct } from '@/shared/api'
import { newUuid } from '@/shared/lib/uuid'
import type { CartLine, PendingBundle } from './types'

export interface AddLineOptions {
  /** По умолчанию цена из карточки товара. */
  priceMinor?: number
  dilutionPct?: number
  bundleId?: string
  warehouseId?: string
}

export function qtyInCart(cart: CartLine[], productId: string): number {
  return cart.filter((l) => l.product.id === productId).reduce((s, l) => s + l.qty, 0)
}

/** Новая строка или прибавка к такой же; сверх остатка можно, нехватку покажут чек и окно оплаты. */
export function addLine(
  cart: CartLine[],
  product: PosProduct,
  qty: number,
  { priceMinor = product.priceMinor ?? 0, dilutionPct, bundleId, warehouseId }: AddLineOptions = {},
): CartLine[] {
  // подарки не объединяем, строки с разной долей масла, связкой или складом тоже
  const index = cart.findIndex(
    (l) =>
      !l.isGift &&
      l.product.id === product.id &&
      l.priceMinor === priceMinor &&
      l.dilutionPct === dilutionPct &&
      l.bundleId === bundleId &&
      l.warehouseId === warehouseId,
  )
  if (index >= 0) {
    return cart.map((l, i) => (i === index ? { ...l, qty: l.qty + qty } : l))
  }
  if (qty <= 0) return cart
  return [
    ...cart,
    {
      lineId: newUuid(),
      product,
      qty,
      priceMinor,
      discountMinor: 0,
      isGift: false,
      isPackaging: false,
      dilutionPct,
      bundleId,
      warehouseId,
    },
  ]
}

export function patchLine(cart: CartLine[], index: number, patch: Partial<CartLine>): CartLine[] {
  return cart.map((l, i) => {
    if (i !== index) return l
    const next = { ...l, ...patch }
    if (patch.qty != null) {
      next.qty = Math.max(0, patch.qty)
    }
    return next
  })
}

/** Убирает строку; у набора-подарка уходят все строки группы. */
export function removeLine(cart: CartLine[], index: number): CartLine[] {
  const target = cart[index]
  if (target?.giftGroupId) {
    return cart.filter((l) => l.giftGroupId !== target.giftGroupId)
  }
  return cart.filter((_, j) => j !== index)
}

export function removeBundle(cart: CartLine[], bundleId: string | undefined): CartLine[] {
  return cart.filter((l) => l.bundleId !== bundleId)
}

export function giftLine(rule: PosGiftRule, groupId: string, product: PosProduct, qty: number): CartLine {
  return {
    lineId: newUuid(),
    product,
    qty,
    priceMinor: 0,
    discountMinor: 0,
    isGift: true,
    giftRuleId: rule.id,
    giftGroupId: groupId,
  }
}

/** Конкретные товары набора сразу становятся строками, наливные позиции ждут выбора парфюма. */
export function startGiftBundle(rule: PosGiftRule): PendingBundle {
  const groupId = newUuid()
  const lines: CartLine[] = []
  for (const it of rule.items) {
    if (it.product != null) lines.push(giftLine(rule, groupId, it.product, it.qty))
  }
  const queue = rule.items.filter((it) => it.product == null)
  return { rule, groupId, lines, queue }
}

/** Парфюм выбран для первой позиции очереди. */
export function pickBundleItem(bundle: PendingBundle, product: PosProduct): PendingBundle {
  const [item, ...rest] = bundle.queue
  return {
    ...bundle,
    lines: [...bundle.lines, giftLine(bundle.rule, bundle.groupId, product, item.qty)],
    queue: rest,
  }
}
