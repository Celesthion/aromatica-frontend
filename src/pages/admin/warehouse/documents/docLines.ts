import { discountMinorForPct, lineSumMinor, somToMinorOr0 } from '@/shared/lib/money'

export interface EditableLine {
  productId: string
  productName: string
  qty: string
  priceSom: string
  discountPct: string
}

export function parseLine(l: EditableLine) {
  const qty = parseFloat(l.qty) || 0
  const priceMinor = somToMinorOr0(l.priceSom)
  // скидку вводят в процентах, а сервер хранит сумму
  const discountMinor = discountMinorForPct(qty, priceMinor, parseFloat(l.discountPct) || 0)
  return { qty, priceMinor, discountMinor }
}

export function lineSum(l: EditableLine): number {
  const { qty, priceMinor, discountMinor } = parseLine(l)
  return lineSumMinor(qty, priceMinor, discountMinor)
}
