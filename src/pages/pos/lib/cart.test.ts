import { describe, expect, it } from 'vitest'
import type { PosGiftRule, PosProduct } from '@/shared/api'
import {
  addLine,
  giftLine,
  patchLine,
  pickBundleItem,
  qtyInCart,
  removeBundle,
  removeLine,
  startGiftBundle,
} from './cart'
import { makeLine, makeProduct } from './testing/fixtures'
import type { CartLine } from './types'

const product = (id: string, over: Partial<PosProduct> = {}) =>
  makeProduct({ id, name: id, priceMinor: 100_00, ...over })

const line = (lineId: string, over: Partial<CartLine> = {}) =>
  makeLine({ lineId, product: product(lineId), priceMinor: 100_00, ...over })

const rule = (items: PosGiftRule['items']): PosGiftRule => ({
  id: 'rule',
  name: 'Акция',
  conditions: [],
  stepMinor: null,
  maxGifts: null,
  items,
})

describe('addLine', () => {
  it('новая строка берёт цену из карточки и получает свой lineId', () => {
    const cart = addLine([], product('a', { priceMinor: 250_00 }), 2)
    expect(cart).toHaveLength(1)
    expect(cart[0]).toMatchObject({
      qty: 2,
      priceMinor: 250_00,
      discountMinor: 0,
      isGift: false,
      isPackaging: false,
    })
    expect(cart[0].lineId).toEqual(expect.any(String))
  })

  it('товар без цены попадает в чек по нулевой цене', () => {
    expect(addLine([], product('a', { priceMinor: null }), 1)[0].priceMinor).toBe(0)
  })

  it('тот же товар по той же цене прибавляется к строке', () => {
    const p = product('a')
    const cart = addLine(addLine([], p, 1), p, 2)
    expect(cart).toHaveLength(1)
    expect(cart[0].qty).toBe(3)
  })

  it('разная доля масла, связка или склад дают отдельные строки', () => {
    const p = product('oil', { unit: 'ML', kind: 'BULK' })
    let cart = addLine([], p, 5, { dilutionPct: 50 })
    cart = addLine(cart, p, 5, { dilutionPct: 30 })
    cart = addLine(cart, p, 5, { dilutionPct: 50, bundleId: 'b1' })
    cart = addLine(cart, p, 5, { warehouseId: 'shelf' })
    expect(cart).toHaveLength(4)
  })

  it('с подарком того же товара не объединяет', () => {
    const p = product('a')
    const cart = addLine([line('g', { product: p, isGift: true, priceMinor: 100_00 })], p, 1)
    expect(cart).toHaveLength(2)
  })

  it('остаток не ограничивает количество', () => {
    expect(addLine([], product('a', { qty: 1 }), 5)[0].qty).toBe(5)
  })

  it('нулевое количество новую строку не создаёт', () => {
    expect(addLine([], product('a'), 0)).toEqual([])
  })
})

describe('patchLine', () => {
  it('меняет только строку с нужным индексом', () => {
    const cart = [line('a'), line('b')]
    const next = patchLine(cart, 1, { discountMinor: 10_00 })
    expect(next[0]).toBe(cart[0])
    expect(next[1].discountMinor).toBe(10_00)
  })

  it('количество ниже нуля не опускается', () => {
    expect(patchLine([line('a', { qty: 2 })], 0, { qty: -3 })[0].qty).toBe(0)
  })

  it('сверх остатка количество не режет', () => {
    const cart = [line('a', { product: product('a', { qty: 1 }) })]
    expect(patchLine(cart, 0, { qty: 7 })[0].qty).toBe(7)
  })
})

describe('removeLine', () => {
  it('убирает строку по индексу', () => {
    expect(removeLine([line('a'), line('b')], 0).map((l) => l.lineId)).toEqual(['b'])
  })

  it('у набора-подарка убирает всю группу', () => {
    const cart = [
      line('a'),
      line('g1', { isGift: true, giftGroupId: 'set' }),
      line('g2', { isGift: true, giftGroupId: 'set' }),
    ]
    expect(removeLine(cart, 2).map((l) => l.lineId)).toEqual(['a'])
  })

  it('индекс за пределами чека ничего не меняет', () => {
    expect(removeLine([line('a')], 5)).toHaveLength(1)
  })
})

describe('removeBundle и qtyInCart', () => {
  it('removeBundle убирает масло и атомайзер одного флакона', () => {
    const cart = [line('oil', { bundleId: 'b1' }), line('atomizer', { bundleId: 'b1' }), line('other')]
    expect(removeBundle(cart, 'b1').map((l) => l.lineId)).toEqual(['other'])
  })

  it('qtyInCart складывает все строки товара, включая подарки', () => {
    const p = product('a')
    const cart = [
      line('1', { product: p, qty: 2 }),
      line('2', { product: p, qty: 1, isGift: true }),
      line('b'),
    ]
    expect(qtyInCart(cart, 'a')).toBe(3)
    expect(qtyInCart(cart, 'missing')).toBe(0)
  })
})

describe('наборы-подарки', () => {
  it('giftLine: бесплатная строка с правилом и группой', () => {
    expect(giftLine(rule([]), 'set', product('a'), 2)).toMatchObject({
      qty: 2,
      priceMinor: 0,
      discountMinor: 0,
      isGift: true,
      giftRuleId: 'rule',
      giftGroupId: 'set',
    })
  })

  it('startGiftBundle: конкретные товары сразу строками, наливные в очередь', () => {
    const pour = { product: null, kind: 'SPLIT' as const, kindName: 'Распив', qty: 2 }
    const bundle = startGiftBundle(
      rule([{ product: product('tube'), kind: null, kindName: null, qty: 1 }, pour]),
    )
    expect(bundle.lines).toHaveLength(1)
    expect(bundle.lines[0]).toMatchObject({ product: { id: 'tube' }, giftGroupId: bundle.groupId })
    expect(bundle.queue).toEqual([pour])
  })

  it('pickBundleItem: выбранный парфюм уходит в строки, очередь сдвигается', () => {
    const items = [
      { product: null, kind: 'SPLIT' as const, kindName: 'Распив', qty: 2 },
      { product: null, kind: 'BULK' as const, kindName: 'Разлив', qty: 3 },
    ]
    const bundle = startGiftBundle(rule(items))
    const next = pickBundleItem(bundle, product('perfume'))
    expect(next.lines).toHaveLength(1)
    expect(next.lines[0]).toMatchObject({ product: { id: 'perfume' }, qty: 2, giftGroupId: bundle.groupId })
    expect(next.queue).toEqual([items[1]])
  })
})
