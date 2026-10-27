import { describe, expect, it } from 'vitest'
import { returnItems, returnSumMinor } from './returns'
import { makeLineDto as line } from './testing/fixtures'

describe('returnItems', () => {
  it('штучное: строка к строке, любым количеством', () => {
    const items = returnItems([line({ id: 'a', qty: 3 })])
    expect(items).toHaveLength(1)
    expect(items[0].whole).toBe(false)
    expect(items[0].qty).toBe(3)
    expect(returnSumMinor(items[0], 2)).toBe(200_000)
  })

  it('связка это один флакон целиком, воды в нём не видно', () => {
    const items = returnItems([
      line({
        id: 'oil',
        productName: 'Aventus · Разлив',
        productKind: 'BULK',
        qty: 5,
        priceMinor: 30_000,
        dilutionPct: 50,
        bundleId: 'b',
      }),
      line({
        id: 'water',
        productName: 'Парфюмерная вода',
        productKind: 'BASE',
        qty: 5,
        priceMinor: 0,
        bundleId: 'b',
      }),
      line({
        id: 'atom',
        productName: 'Атомайзер',
        productKind: 'ATOMIZER',
        qty: 1,
        priceMinor: 50_000,
        bundleId: 'b',
      }),
    ])
    expect(items).toHaveLength(1)
    const bottle = items[0]
    expect(bottle.whole).toBe(true)
    expect(bottle.hint).toBe('флакон 10 мл · 50 %')
    expect(bottle.lines.map((l) => l.id)).toEqual(['oil', 'atom'])
    // платят за масло и атомайзер, вода бесплатна
    expect(returnSumMinor(bottle, 1)).toBe(5 * 30_000 + 50_000)
  })

  it('связка и штучное в одном чеке не смешиваются', () => {
    const items = returnItems([
      line({ id: 'oil', productKind: 'BULK', qty: 5, dilutionPct: 50, bundleId: 'b' }),
      line({ id: 'box', productName: 'Коробка', qty: 1 }),
    ])
    expect(items.map((i) => i.key)).toEqual(['b', 'box'])
  })
})
