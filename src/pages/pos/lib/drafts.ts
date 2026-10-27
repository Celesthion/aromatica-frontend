import type { PosCustomer, PosProduct } from '@/shared/api'
import { discountMinorForPct } from '@/shared/lib/money'
import { newUuid } from '@/shared/lib/uuid'
import { NO_RECEIPT_DISCOUNT, type ReceiptDiscount } from './discount'
import type { CartLine } from './types'

/**
 * Снимок корзины в отложенном чеке. Бэк хранит payload как есть и не разбирает,
 * поэтому проверяем его сами при восстановлении (parseDraftPayload).
 */
export interface DraftPayload {
  cart: CartLine[]
  receiptDiscount: ReceiptDiscount
  fromReservation: { id: string; name: string } | null
  customer: PosCustomer | null
}

/** Тело createPosDraft: поля для списка черновиков и полный снимок. */
export function draftSnapshot(
  cart: CartLine[],
  receiptDiscount: ReceiptDiscount,
  fromReservation: DraftPayload['fromReservation'],
  customer: DraftPayload['customer'],
  sumMinor: number,
): { sumMinor: number; positions: number; preview: string; payload: DraftPayload } {
  return {
    sumMinor,
    positions: cart.length,
    preview:
      cart
        .slice(0, 2)
        .map((l) => l.product.name)
        .join(', ') + (cart.length > 2 ? '…' : ''),
    payload: { cart, receiptDiscount, fromReservation, customer },
  }
}

/** Строка корзины из сохранённого черновика: в старых версиях скидка строки лежит в discountPct. */
type StoredLine = Omit<CartLine, 'discountMinor'> & { discountMinor?: number; discountPct?: number }

function isStoredLine(l: unknown): l is StoredLine {
  const x = l as Partial<StoredLine> | null
  return (
    x != null &&
    typeof x === 'object' &&
    typeof x.qty === 'number' &&
    typeof x.priceMinor === 'number' &&
    (typeof x.discountMinor === 'number' || typeof x.discountPct === 'number') &&
    typeof x.isGift === 'boolean' &&
    x.product != null &&
    typeof x.product.id === 'string'
  )
}

/** Разбирает payload до обращений к серверу: при битом формате черновик на бэке остаётся целым. */
export function parseDraftPayload(raw: unknown): DraftPayload {
  const p = raw as (Omit<Partial<DraftPayload>, 'cart'> & { cart?: unknown }) | null
  if (p == null || typeof p !== 'object' || !Array.isArray(p.cart) || !p.cart.every(isStoredLine)) {
    throw new Error('Черновик сохранён другой версией кассы — вернуть его не получится')
  }
  const from = p.fromReservation
  const buyer = p.customer
  return {
    cart: p.cart.map(({ discountPct, ...line }) => ({
      ...line,
      discountMinor:
        typeof line.discountMinor === 'number'
          ? line.discountMinor
          : discountMinorForPct(line.qty, line.priceMinor, discountPct ?? 0),
      lineId: typeof line.lineId === 'string' ? line.lineId : newUuid(),
    })),
    receiptDiscount: normalizeReceiptDiscount(p.receiptDiscount),
    fromReservation:
      from != null && typeof from.id === 'string' && typeof from.name === 'string'
        ? { id: from.id, name: from.name }
        : null,
    // без id покупателя не привязать к чеку
    customer: buyer != null && typeof buyer.id === 'string' && typeof buyer.name === 'string' ? buyer : null,
  }
}

/**
 * При восстановлении подставляет свежие карточки товаров с текущими остатками, цена строки
 * остаётся как в отложенном чеке. Товар, пропавший из каталога, получает остаток 0,
 * чтобы проверка на минус его подсветила.
 */
export function withFreshProducts(cart: CartLine[], cards: PosProduct[]): CartLine[] {
  const byId = new Map(cards.map((c) => [c.id, c]))
  return cart.map((l) => {
    const fresh = byId.get(l.product.id)
    return { ...l, product: fresh ?? { ...l.product, qty: 0 } }
  })
}

/** Старые черновики хранят скидку чека строкой процентов. */
function normalizeReceiptDiscount(raw: unknown): ReceiptDiscount {
  if (typeof raw === 'string') return { mode: 'pct', value: raw }
  const o = raw as Partial<ReceiptDiscount> | null
  if (o && (o.mode === 'pct' || o.mode === 'sum') && typeof o.value === 'string') {
    return { mode: o.mode, value: o.value }
  }
  return NO_RECEIPT_DISCOUNT
}
