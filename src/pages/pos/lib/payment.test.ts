import { describe, expect, it } from 'vitest'
import { NO_RECEIPT_DISCOUNT } from './discount'
import { paymentTotals } from './payment'
import { makeLine, makeProduct } from './testing/fixtures'
import type { CartLine } from './types'

const product = (id: string, priceMinor: number) => makeProduct({ id, name: id, priceMinor })

const line = (priceMinor: number, extra: Partial<CartLine> = {}) =>
  makeLine({
    lineId: `l-${priceMinor}`,
    product: product(`p-${priceMinor}`, priceMinor),
    priceMinor,
    ...extra,
  })

const totals = (over: Partial<Parameters<typeof paymentTotals>[0]> = {}) =>
  paymentTotals({
    cart: [line(100_00)],
    receiptDiscount: NO_RECEIPT_DISCOUNT,
    packaging: [],
    packagingQty: {},
    certificateBalanceMinor: null,
    ...over,
  })

describe('paymentTotals', () => {
  it('без скидок, упаковки и сертификата к оплате идёт сумма товаров', () => {
    expect(totals()).toMatchObject({ goodsMinor: 100_00, grandMinor: 100_00, dueMinor: 100_00 })
  })

  it('скидка на чек уменьшает итог и показывается отдельной суммой', () => {
    const t = totals({ receiptDiscount: { mode: 'pct', value: '25' } })
    expect(t.goodsMinor).toBe(75_00)
    expect(t.discountMinor).toBe(25_00)
    expect(t.dueMinor).toBe(75_00)
  })

  it('упаковка добавляется к чеку и считается штуками', () => {
    const pack = product('pack', 30_00)
    const t = totals({ packaging: [pack], packagingQty: { pack: 2 } })
    expect(t.packagingMinor).toBe(60_00)
    expect(t.packagingCount).toBe(2)
    expect(t.grandMinor).toBe(160_00)
  })

  // сертификат гасит сумму первым, остаток доплачивают деньгами
  it('сертификат закрывает часть чека, остальное идёт к оплате', () => {
    const t = totals({ certificateBalanceMinor: 40_00 })
    expect(t.certificateMinor).toBe(40_00)
    expect(t.dueMinor).toBe(60_00)
  })

  // сдачи с сертификата нет: списываем не больше суммы чека
  it('сертификат дороже чека списывается только на сумму чека', () => {
    const t = totals({ certificateBalanceMinor: 500_00 })
    expect(t.certificateMinor).toBe(100_00)
    expect(t.dueMinor).toBe(0)
  })

  it('сертификат считается от итога с упаковкой, а не от одних товаров', () => {
    const pack = product('pack', 50_00)
    const t = totals({
      packaging: [pack],
      packagingQty: { pack: 1 },
      certificateBalanceMinor: 200_00,
    })
    expect(t.grandMinor).toBe(150_00)
    expect(t.certificateMinor).toBe(150_00)
    expect(t.dueMinor).toBe(0)
  })

  it('сертификат применяется после скидки, а не до неё', () => {
    const t = totals({ receiptDiscount: { mode: 'pct', value: '50' }, certificateBalanceMinor: 30_00 })
    expect(t.goodsMinor).toBe(50_00)
    expect(t.certificateMinor).toBe(30_00)
    expect(t.dueMinor).toBe(20_00)
  })

  it('пустой чек не даёт отрицательной суммы к оплате', () => {
    const t = totals({ cart: [], certificateBalanceMinor: 100_00 })
    expect(t.grandMinor).toBe(0)
    expect(t.certificateMinor).toBe(0)
    expect(t.dueMinor).toBe(0)
  })

  it('подарки в сумму не идут', () => {
    const t = totals({ cart: [line(100_00), line(0, { isGift: true })] })
    expect(t.grandMinor).toBe(100_00)
  })
})
