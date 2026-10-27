import { describe, expect, it } from 'vitest'
import { NO_RECEIPT_DISCOUNT } from './discount'
import { makeLine, makeProduct } from './testing/fixtures'
import { receiptTotals } from './totals'
import type { CartLine } from './types'

const line = (lineId: string, extra: Partial<CartLine> = {}) =>
  makeLine({
    lineId,
    product: makeProduct({ id: lineId, name: lineId, priceMinor: 100_00 }),
    priceMinor: 100_00,
    ...extra,
  })

describe('receiptTotals', () => {
  it('без скидок к оплате идёт вся сумма строк', () => {
    const t = receiptTotals([line('a'), line('b', { qty: 2 })], NO_RECEIPT_DISCOUNT)
    expect(t.subtotalMinor).toBe(300_00)
    expect(t.totalMinor).toBe(300_00)
    expect(t.payableMinor).toBe(300_00)
    expect(t.lineDiscountMinor).toBe(0)
    expect(t.receiptDiscountMinor).toBe(0)
  })

  it('построчная скидка видна отдельной строкой сводки', () => {
    const t = receiptTotals([line('a', { discountMinor: 10_00 })], NO_RECEIPT_DISCOUNT)
    expect(t.subtotalMinor).toBe(100_00)
    expect(t.totalMinor).toBe(90_00)
    expect(t.lineDiscountMinor).toBe(10_00)
  })

  it('скидка чека накладывается поверх построчной', () => {
    const t = receiptTotals([line('a', { discountMinor: 10_00 })], { mode: 'pct', value: '50' })
    expect(t.totalMinor).toBe(90_00)
    expect(t.payableMinor).toBe(45_00)
    expect(t.receiptDiscountMinor).toBe(45_00)
  })

  it('подарки в сумму не идут и считаются наборами, а не строками', () => {
    const t = receiptTotals(
      [
        line('a'),
        line('g1', { isGift: true, giftGroupId: 'set', priceMinor: 0 }),
        line('g2', { isGift: true, giftGroupId: 'set', priceMinor: 0 }),
      ],
      NO_RECEIPT_DISCOUNT,
    )
    expect(t.subtotalMinor).toBe(100_00)
    expect(t.payableMinor).toBe(100_00)
    expect(t.giftCount).toBe(1)
  })

  it('пустая корзина даёт нули, а не NaN', () => {
    const t = receiptTotals([], { mode: 'pct', value: '20' })
    expect(t).toMatchObject({ subtotalMinor: 0, totalMinor: 0, payableMinor: 0, giftCount: 0 })
  })
})
