import { describe, expect, it } from 'vitest'
import type { PosProduct } from '@/shared/api'
import { remainingQty, stockShortages } from './stock'
import { makeLine, makeProduct } from './testing/fixtures'
import type { CartLine } from './types'

const product = (id: string, qty: number) => makeProduct({ id, name: id, priceMinor: 100_00, qty })

const line = (lineId: string, p: PosProduct, qty: number): CartLine =>
  makeLine({ lineId, product: p, qty, priceMinor: p.priceMinor ?? 0 })

describe('remainingQty', () => {
  it('вычитает уже занятое другими строками того же товара', () => {
    const p = product('a', 5)
    expect(remainingQty([line('1', p, 2)], p)).toBe(3)
  })

  it('исключает правимую строку из занятого', () => {
    const p = product('a', 5)
    expect(remainingQty([line('1', p, 2)], p, '1')).toBe(5)
  })

  it('считает подарочные строки наравне с платными', () => {
    const p = product('a', 3)
    const gift = { ...line('2', p, 1), isGift: true }
    expect(remainingQty([line('1', p, 2), gift], p)).toBe(0)
  })

  it('не уходит ниже нуля при перепродаже', () => {
    const p = product('a', 1)
    expect(remainingQty([line('1', p, 4)], p)).toBe(0)
  })

  it('чужие товары потолок не трогают', () => {
    const a = product('a', 5)
    expect(remainingQty([line('1', product('b', 5), 3)], a)).toBe(5)
  })
})

describe('stockShortages', () => {
  it('пустой чек и достаточный остаток: нехваток нет', () => {
    expect(stockShortages([])).toEqual([])
    expect(stockShortages([line('l1', product('p1', 5), 3)])).toEqual([])
  })

  it('считает, сколько именно не хватает', () => {
    const p = product('p1', 2)
    expect(stockShortages([line('l1', p, 5)])).toEqual([{ product: p, needed: 5, available: 2, short: 3 }])
  })

  it('строки одного товара складываются: подарок плюс платная', () => {
    const p = product('p1', 3)
    const rows = [line('l1', p, 2), { ...line('l2', p, 2), isGift: true }]
    expect(stockShortages(rows)).toEqual([{ product: p, needed: 4, available: 3, short: 1 }])
  })

  it('ровно по остатку не нехватка', () => {
    expect(stockShortages([line('l1', product('p1', 3), 3)])).toEqual([])
  })
})
