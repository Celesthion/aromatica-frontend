import { useEffect, useMemo, useState } from 'react'
import type { PosCustomer, PosGiftRule, PosProduct } from '@/shared/api'
import {
  addLine,
  patchLine,
  qtyInCart,
  removeBundle,
  removeLine,
  type AddLineOptions,
} from '@/pages/pos/lib/cart'
import { NO_RECEIPT_DISCOUNT, type ReceiptDiscount } from '@/pages/pos/lib/discount'
import type { DraftPayload } from '@/pages/pos/lib/drafts'
import { earnedGiftCount, giftOveruseRuleIds, usedGiftCount } from '@/pages/pos/lib/gifts'
import { cartRows } from '@/pages/pos/lib/rows'
import { stockShortages } from '@/pages/pos/lib/stock'
import { receiptTotals } from '@/pages/pos/lib/totals'
import type { CartLine } from '@/pages/pos/lib/types'

/** Собираемый чек: строки, скидка на чек, бронь и покупатель, плюс всё, что из них считается. */
export function useReceipt(giftRules: PosGiftRule[]) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [receiptDiscount, setReceiptDiscount] = useState<ReceiptDiscount>(NO_RECEIPT_DISCOUNT)
  // чек собран из брони: после проведения сервер пометит её проданной
  const [fromReservation, setFromReservation] = useState<DraftPayload['fromReservation']>(null)
  const [customer, setCustomer] = useState<PosCustomer | null>(null)

  // строки удалили: чек больше не по брони
  useEffect(() => {
    if (cart.length === 0 && fromReservation) setFromReservation(null)
  }, [cart.length, fromReservation])

  const rows = useMemo(() => cartRows(cart), [cart])
  const totals = useMemo(() => receiptTotals(cart, receiptDiscount), [cart, receiptDiscount])

  // пороги акций считаются по сумме до скидки чека
  const earnedCount = (rule: PosGiftRule) => earnedGiftCount(rule, cart, totals.totalMinor)
  const usedCount = (ruleId: string) => usedGiftCount(cart, ruleId)
  const matchedGiftRules = giftRules.filter((r) => earnedCount(r) > 0)
  const addableGifts = matchedGiftRules.reduce((s, r) => s + Math.max(0, earnedCount(r) - usedCount(r.id)), 0)
  // подарков больше положенного: чек урезали после выдачи или правило пропало из акций
  const giftOveruse = giftOveruseRuleIds(cart, giftRules, totals.totalMinor)
  const payBlocked =
    cart.length === 0 || totals.totalMinor <= 0 || cart.some((l) => l.qty <= 0) || giftOveruse.length > 0

  return {
    cart,
    receiptDiscount,
    setReceiptDiscount,
    fromReservation,
    unlinkReservation: () => setFromReservation(null),
    customer,
    setCustomer,
    rows,
    totals,
    earnedCount,
    usedCount,
    matchedGiftRules,
    addableGifts,
    giftOveruse,
    shortages: stockShortages(cart),
    payBlocked,
    inCartQty: (productId: string) => qtyInCart(cart, productId),
    addLine: (product: PosProduct, qty: number, options?: AddLineOptions) =>
      setCart((prev) => addLine(prev, product, qty, options)),
    addLines: (lines: CartLine[]) => setCart((prev) => [...prev, ...lines]),
    patchLine: (index: number, patch: Partial<CartLine>) => setCart((prev) => patchLine(prev, index, patch)),
    removeLine: (index: number) => setCart((prev) => removeLine(prev, index)),
    removeBundle: (bundleId: string | undefined) => setCart((prev) => removeBundle(prev, bundleId)),
    // покупателя не сбрасывает
    clear: () => {
      setCart([])
      setReceiptDiscount(NO_RECEIPT_DISCOUNT)
      setFromReservation(null)
    },
    load: (snapshot: DraftPayload) => {
      setCart(snapshot.cart)
      setReceiptDiscount(snapshot.receiptDiscount)
      setFromReservation(snapshot.fromReservation)
      setCustomer(snapshot.customer)
    },
  }
}

export type Receipt = ReturnType<typeof useReceipt>
