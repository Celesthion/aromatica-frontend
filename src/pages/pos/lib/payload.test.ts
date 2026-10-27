import { describe, expect, it } from 'vitest'
import { buildReceiptLines, giftBaseMinor } from './payload'
import { makeLine, makeProduct } from './testing/fixtures'

const product = (id: string, priceMinor = 100_000) => makeProduct({ id, name: id, priceMinor })

describe('buildReceiptLines', () => {
  it('раскладывает скидку чека по строкам поверх построчной, суммой', () => {
    // строка 100 000 - 10 000 = 90 000; 10 % чека от 90 000 = 9 000; всего 19 000
    const lines = buildReceiptLines([makeLine({ discountMinor: 10_000 })], [], { mode: 'pct', value: '10' })
    expect(lines[0].discountMinor).toBe(19_000)
  })

  it('скидка чека суммой делится по строкам целыми тыйынами', () => {
    const lines = buildReceiptLines(
      [makeLine({ lineId: 'a' }), makeLine({ lineId: 'b' }), makeLine({ lineId: 'c' })],
      [],
      { mode: 'sum', value: '100' },
    )
    expect(lines.map((l) => l.discountMinor)).toEqual([3_334, 3_333, 3_333])
  })

  it('подарки не дисконтируются и несут метки правила и набора', () => {
    const lines = buildReceiptLines(
      [makeLine({ isGift: true, discountMinor: 0, priceMinor: 0, giftRuleId: 'r1', giftGroupId: 'g1' })],
      [],
      { mode: 'pct', value: '15' },
    )
    expect(lines[0]).toMatchObject({ discountMinor: 0, gift: true, giftRuleId: 'r1', giftGroupId: 'g1' })
  })

  it('платные строки меток подарка не несут', () => {
    const lines = buildReceiptLines([makeLine({ giftRuleId: 'мусор', giftGroupId: 'мусор' })], [], {
      mode: 'pct',
      value: '0',
    })
    expect(lines[0].gift).toBeUndefined()
    expect(lines[0].giftRuleId).toBeUndefined()
    expect(lines[0].giftGroupId).toBeUndefined()
  })

  it('упаковка идёт платными строками без скидки, нулевые количества отбрасываются', () => {
    const lines = buildReceiptLines(
      [],
      [
        { product: product('pkg1', 5_000), qty: 2 },
        { product: product('pkg2', 3_000), qty: 0 },
      ],
      { mode: 'pct', value: '20' },
    )
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ productId: 'pkg1', qty: 2, priceMinor: 5_000, discountMinor: 0 })
  })

  it('строка упаковки в корзине не получает скидку чека', () => {
    const lines = buildReceiptLines([makeLine({ isPackaging: true, discountMinor: 0 })], [], {
      mode: 'pct',
      value: '25',
    })
    expect(lines[0].discountMinor).toBe(0)
  })
})

describe('giftBaseMinor', () => {
  it('платная сумма до скидки чека: строчная скидка учитывается, подарки дают нули', () => {
    const base = giftBaseMinor([
      makeLine({ qty: 2, priceMinor: 100_000, discountMinor: 100_000 }),
      makeLine({ isGift: true, priceMinor: 0 }),
    ])
    expect(base).toBe(100_000)
  })
})
