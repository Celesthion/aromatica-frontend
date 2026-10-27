import type { PosProduct } from '@/shared/api'
import type { ReceiptDiscount } from './discount'
import { receiptTotals } from './totals'
import type { CartLine } from './types'

interface PaymentTotals {
  /** Товары с построчными скидками и скидкой на чек. */
  goodsMinor: number
  /** Скидка на чек, кассиру показываем отдельной строкой. */
  discountMinor: number
  /** Упаковку выбирают в окне оплаты, она добавляется к сумме чека. */
  packagingMinor: number
  packagingCount: number
  grandMinor: number
  certificateMinor: number
  /** Остаток к оплате деньгами: его делят на нал и безнал, от него считают сдачу. */
  dueMinor: number
}

/**
 * Суммы окна оплаты. Порядок: скидки, упаковка, сертификат. Сертификат гасит сумму первым,
 * но не больше своего остатка; сдачи с него нет, чтобы его нельзя было обналичить мелкой покупкой.
 * К оплате не бывает меньше нуля.
 */
export function paymentTotals(input: {
  cart: CartLine[]
  receiptDiscount: ReceiptDiscount
  packaging: PosProduct[]
  packagingQty: Record<string, number>
  /** Остаток на сертификате; null - сертификата нет или он не годен. */
  certificateBalanceMinor: number | null
}): PaymentTotals {
  const { cart, receiptDiscount, packaging, packagingQty, certificateBalanceMinor } = input
  const { payableMinor: goodsMinor, receiptDiscountMinor: discountMinor } = receiptTotals(
    cart,
    receiptDiscount,
  )
  const qty = (p: PosProduct) => packagingQty[p.id] ?? 0
  const packagingMinor = packaging.reduce((s, p) => s + qty(p) * (p.priceMinor ?? 0), 0)
  const grandMinor = goodsMinor + packagingMinor
  const certificateMinor = certificateBalanceMinor != null ? Math.min(certificateBalanceMinor, grandMinor) : 0
  return {
    goodsMinor,
    discountMinor,
    packagingMinor,
    packagingCount: packaging.reduce((s, p) => s + qty(p), 0),
    grandMinor,
    certificateMinor,
    dueMinor: Math.max(0, grandMinor - certificateMinor),
  }
}
