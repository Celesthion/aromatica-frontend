import type { LineRequest, PosProduct } from '@/shared/api'
import { sumLinesMinor } from '@/shared/lib/money'
import { receiptDiscountShares, type ReceiptDiscount } from './discount'
import type { CartLine } from './types'

interface PackagingPick {
  product: PosProduct
  qty: number
}

/**
 * Строки чека для запроса, общие для веба и мобилки. Бэк принимает скидку только построчно,
 * поэтому скидка на чек раскладывается по платным строкам; подарки несут метки правила и набора,
 * по ним бэк проверяет, что подарок положен. Упаковка идёт платными строками без скидки.
 */
export function buildReceiptLines(
  cart: CartLine[],
  packaging: PackagingPick[],
  rd: ReceiptDiscount,
): LineRequest[] {
  const shares = receiptDiscountShares(cart, rd)
  return [
    ...cart.map((l) => ({
      productId: l.product.id,
      qty: l.qty,
      priceMinor: l.priceMinor,
      discountMinor: l.isPackaging ? 0 : l.discountMinor + (shares.get(l.lineId) ?? 0),
      gift: l.isGift || undefined,
      giftRuleId: l.isGift ? l.giftRuleId : undefined,
      giftGroupId: l.isGift ? l.giftGroupId : undefined,
      dilutionPct: l.dilutionPct,
      bundleId: l.bundleId,
      warehouseId: l.warehouseId,
    })),
    ...packaging
      .filter((p) => p.qty > 0)
      .map((p) => ({
        productId: p.product.id,
        qty: p.qty,
        priceMinor: p.product.priceMinor ?? 0,
        discountMinor: 0,
      })),
  ]
}

/**
 * База порогов акций: платная сумма до скидки на чек (подарки стоят ноль и в неё не входят).
 * Сервер сверяет её с суммой платных строк.
 */
export function giftBaseMinor(cart: CartLine[]): number {
  return sumLinesMinor(cart)
}
