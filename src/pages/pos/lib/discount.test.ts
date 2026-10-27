import { describe, expect, it } from 'vitest'
import {
  NO_RECEIPT_DISCOUNT,
  parseReceiptPct,
  receiptDiscountMinor,
  receiptDiscountShares,
  receiptTotalMinor,
} from './discount'
import { makeLine as line } from './testing/fixtures'

describe('parseReceiptPct', () => {
  it('пусто и мусор дают 0, запятая как точка, границы 0-100', () => {
    expect(parseReceiptPct('')).toBe(0)
    expect(parseReceiptPct('abc')).toBe(0)
    expect(parseReceiptPct('7,5')).toBe(7.5)
    expect(parseReceiptPct('150')).toBe(100)
    expect(parseReceiptPct('-5')).toBe(0)
  })
})

describe('receiptDiscountMinor', () => {
  it('процент считается от суммы после построчных скидок', () => {
    expect(receiptDiscountMinor([line({ discountMinor: 10_000 })], { mode: 'pct', value: '10' })).toBe(9_000)
  })

  it('сумма как ввели, но не больше базы; подарки и упаковка не в базе', () => {
    const gift = line({ lineId: 'g', isGift: true, priceMinor: 0 })
    const pack = line({ lineId: 'pk', isPackaging: true, priceMinor: 5_000 })
    expect(receiptDiscountMinor([line(), gift, pack], { mode: 'sum', value: '250' })).toBe(25_000)
    expect(receiptDiscountMinor([line()], { mode: 'sum', value: '5000' })).toBe(100_000)
    expect(receiptDiscountMinor([line()], NO_RECEIPT_DISCOUNT)).toBe(0)
  })
})

describe('receiptDiscountShares', () => {
  it('раскладывает сумму по строкам целыми тыйынами, итог сходится', () => {
    const cart = [line({ lineId: 'a' }), line({ lineId: 'b' }), line({ lineId: 'c' })]
    const shares = receiptDiscountShares(cart, { mode: 'sum', value: '100' })
    expect([...shares.values()]).toEqual([3_334, 3_333, 3_333])
    expect([...shares.values()].reduce((s, v) => s + v, 0)).toBe(10_000)
  })

  it('пропорционально суммам строк, доля не больше строки', () => {
    const cart = [line({ lineId: 'a', priceMinor: 300_000 }), line({ lineId: 'b', priceMinor: 100_000 })]
    const shares = receiptDiscountShares(cart, { mode: 'pct', value: '10' })
    expect(shares.get('a')).toBe(30_000)
    expect(shares.get('b')).toBe(10_000)
  })

  it('на случайных корзинах сумма долей всегда равна скидке чека', () => {
    let seed = 7
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let n = 0; n < 200; n++) {
      const cart = Array.from({ length: 1 + Math.floor(rnd() * 6) }, (_, i) =>
        line({
          lineId: `l${i}`,
          qty: Math.round(rnd() * 5 * 100) / 100 + 0.01,
          priceMinor: Math.floor(rnd() * 500_000) + 1,
          discountMinor: Math.floor(rnd() * 1_000),
        }),
      )
      const rd = { mode: 'sum' as const, value: String(Math.floor(rnd() * 3000)) }
      const shares = receiptDiscountShares(cart, rd)
      const sum = [...shares.values()].reduce((s, v) => s + v, 0)
      expect(sum).toBe(receiptDiscountMinor(cart, rd))
      for (const l of cart)
        expect(shares.get(l.lineId) ?? 0).toBeLessThanOrEqual(Math.round(l.qty * l.priceMinor))
    }
  })
})

describe('receiptTotalMinor', () => {
  it('без скидок: просто сумма строк', () => {
    expect(receiptTotalMinor([line(), line({ lineId: 'l2', qty: 2 })], NO_RECEIPT_DISCOUNT)).toBe(300_000)
  })

  it('скидка чека поверх построчной', () => {
    expect(receiptTotalMinor([line({ discountMinor: 10_000 })], { mode: 'pct', value: '10' })).toBe(81_000)
  })

  it('подарок не дисконтируется и не входит в базу', () => {
    const gift = line({ lineId: 'g', isGift: true, priceMinor: 0 })
    expect(receiptTotalMinor([line(), gift], { mode: 'pct', value: '20' })).toBe(80_000)
  })
})
