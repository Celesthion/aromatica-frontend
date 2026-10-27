import { describe, expect, it } from 'vitest'
import { cartRows } from './rows'
import { makeLine, makeProduct } from './testing/fixtures'
import type { CartLine } from './types'

const line = (lineId: string, extra: Partial<CartLine> = {}) =>
  makeLine({
    lineId,
    product: makeProduct({ id: lineId, name: lineId, priceMinor: 100_00 }),
    priceMinor: 100_00,
    ...extra,
  })

const gift = (lineId: string, groupId: string) =>
  line(lineId, { isGift: true, giftGroupId: groupId, priceMinor: 0 })

describe('cartRows', () => {
  it('платные строки идут по одной и помнят свой индекс в корзине', () => {
    const rows = cartRows([line('a'), line('b')])
    expect(rows.gifts).toEqual([])
    expect(rows.paid.map((r) => [r.line.lineId, r.index])).toEqual([
      ['a', 0],
      ['b', 1],
    ])
  })

  it('строки одного набора-подарка склеиваются в один блок', () => {
    const rows = cartRows([gift('g1', 'set'), gift('g2', 'set'), line('a')])
    expect(rows.gifts).toHaveLength(1)
    expect(rows.gifts[0].items.map((i) => i.line.lineId)).toEqual(['g1', 'g2'])
    expect(rows.paid.map((r) => r.line.lineId)).toEqual(['a'])
  })

  it('разные наборы дают разные блоки', () => {
    const rows = cartRows([gift('g1', 'one'), gift('g2', 'two')])
    expect(rows.gifts.map((r) => r.groupId)).toEqual(['one', 'two'])
  })

  it('разорванный набор не склеивается через платную строку', () => {
    const rows = cartRows([gift('g1', 'set'), line('a'), gift('g2', 'set')])
    expect(rows.gifts).toHaveLength(2)
  })

  it('подарок без группы остаётся отдельной платной строкой чека', () => {
    const rows = cartRows([line('g', { isGift: true, priceMinor: 0 })])
    expect(rows.gifts).toEqual([])
    expect(rows.paid).toHaveLength(1)
  })

  it('упаковка в блоки не попадает', () => {
    const rows = cartRows([line('a'), line('pack', { isPackaging: true })])
    expect(rows.paid.map((r) => r.line.lineId)).toEqual(['a'])
  })

  // индексы указывают в исходную корзину, а не в отфильтрованный список
  it('индексы не сдвигаются из-за пропущенной упаковки', () => {
    const rows = cartRows([line('pack', { isPackaging: true }), line('a')])
    expect(rows.paid[0].index).toBe(1)
  })
})
