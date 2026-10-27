import { create } from 'zustand'
import type { PosCustomer, PosProduct } from '@/shared/api'
import { NO_RECEIPT_DISCOUNT, receiptTotalMinor, type ReceiptDiscount } from '@/pages/pos/lib/discount'
import { remainingQty } from '@/pages/pos/lib/stock'
import type { CartLine } from '@/pages/pos/lib/types'
import { discountMinorForPct } from '@/shared/lib/money'
import { newUuid } from '@/shared/lib/uuid'

// id должны быть уникальны и после перезапуска: отложенный чек возвращается со старыми id
export const nextLineId = () => newUuid()
export const nextGiftGroupId = () => newUuid()

interface ReservationRef {
  id: string
  name: string
}

interface AddOptions {
  dilutionPct?: number
  bundleId?: string
  warehouseId?: string
}

interface CartState {
  lines: CartLine[]
  receiptDiscount: ReceiptDiscount
  customer: PosCustomer | null
  /** Бронь, из которой собран чек: после проведения она пометится проданной. */
  fromReservation: ReservationRef | null

  /** Строки с bundleId или warehouseId (налив, полка) не сливаются с другими. */
  add: (product: PosProduct, qty: number, priceMinor: number, opts?: AddOptions) => void
  /** Флакон ушёл на полку: убирает все строки его связки. */
  removeBundle: (bundleId: string) => void
  addGiftGroup: (lines: CartLine[]) => void
  setQty: (lineId: string, qty: number) => void
  /** Скидка вводится процентом, хранится суммой в тыйынах. */
  setDiscount: (lineId: string, pct: number) => void
  remove: (lineId: string) => void
  removeGiftGroup: (groupId: string) => void
  setReceiptDiscount: (rd: ReceiptDiscount) => void
  setCustomer: (customer: PosCustomer | null) => void
  setFromReservation: (from: ReservationRef | null) => void
  /** Отложенный чек или продажа брони заменяют корзину целиком. */
  replaceAll: (state: {
    lines: CartLine[]
    receiptDiscount: ReceiptDiscount
    customer: PosCustomer | null
    fromReservation: ReservationRef | null
  }) => void
  clear: () => void
}

export const useCart = create<CartState>((set) => ({
  lines: [],
  receiptDiscount: NO_RECEIPT_DISCOUNT,
  customer: null,
  fromReservation: null,

  add: (product, qty, priceMinor, opts) =>
    set((s) => {
      const cap = remainingQty(s.lines, product)
      const take = Math.min(qty, cap)
      if (take <= 0) return s
      const same =
        opts?.bundleId == null && opts?.warehouseId == null
          ? s.lines.find(
              (l) =>
                l.product.id === product.id &&
                l.priceMinor === priceMinor &&
                !l.isGift &&
                l.bundleId == null &&
                l.warehouseId == null,
            )
          : undefined
      if (same) return { lines: s.lines.map((l) => (l === same ? { ...l, qty: l.qty + take } : l)) }
      return {
        lines: [
          ...s.lines,
          {
            lineId: nextLineId(),
            product,
            qty: take,
            priceMinor,
            discountMinor: 0,
            isGift: false,
            dilutionPct: opts?.dilutionPct,
            bundleId: opts?.bundleId,
            warehouseId: opts?.warehouseId,
          },
        ],
      }
    }),

  removeBundle: (bundleId) => set((s) => ({ lines: s.lines.filter((l) => l.bundleId !== bundleId) })),

  addGiftGroup: (giftLines) => set((s) => ({ lines: [...s.lines, ...giftLines] })),

  setQty: (lineId, qty) =>
    set((s) => ({
      lines: s.lines.flatMap((l) => {
        if (l.lineId !== lineId) return [l]
        const cap = remainingQty(s.lines, l.product, lineId)
        const next = Math.min(Math.max(0, qty), cap)
        return next === 0 ? [] : [{ ...l, qty: next }]
      }),
    })),

  setDiscount: (lineId, pct) =>
    set((s) => ({
      lines: s.lines.map((l) =>
        l.lineId === lineId
          ? { ...l, discountMinor: discountMinorForPct(l.qty, l.priceMinor, Math.min(100, Math.max(0, pct))) }
          : l,
      ),
    })),

  remove: (lineId) => set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) })),

  removeGiftGroup: (groupId) => set((s) => ({ lines: s.lines.filter((l) => l.giftGroupId !== groupId) })),

  setReceiptDiscount: (receiptDiscount) => set({ receiptDiscount }),
  setCustomer: (customer) => set({ customer }),
  setFromReservation: (fromReservation) => set({ fromReservation }),
  replaceAll: (state) => set({ ...state }),
  clear: () =>
    set({ lines: [], receiptDiscount: NO_RECEIPT_DISCOUNT, customer: null, fromReservation: null }),
}))

/** Платная сумма без скидки чека: по ней считаются пороги акций. */
export function paidGoodsMinor(lines: CartLine[]): number {
  return receiptTotalMinor(
    lines.filter((l) => !l.isGift),
    NO_RECEIPT_DISCOUNT,
  )
}
