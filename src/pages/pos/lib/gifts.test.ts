import { describe, expect, it } from 'vitest'
import type { GiftCondition, PosGiftRule, PosProduct } from '@/shared/api'
import { earnedGiftCount, giftOveruseRuleIds, usedGiftCount } from './gifts'
import { makeLine, makeProduct } from './testing/fixtures'
import type { CartLine } from './types'

const product = (over: Partial<PosProduct> = {}) => makeProduct({ volumeMl: 50, ...over })

const line = (over: Partial<CartLine> = {}) => makeLine({ product: product(), ...over })

function rule(over: Partial<PosGiftRule> = {}): PosGiftRule {
  return {
    id: 'r1',
    name: 'Акция',
    conditions: [],
    stepMinor: null,
    maxGifts: null,
    items: [],
    ...over,
  }
}

const sum = (minSumMinor: number, group = 0): GiftCondition => ({
  type: 'SUM',
  group,
  minSumMinor,
  kind: null,
  minVolumeMl: null,
  productId: null,
})

const byKind = (kind: string, minVolumeMl: number | null = null, group = 0): GiftCondition => ({
  type: 'KIND',
  group,
  minSumMinor: null,
  kind,
  minVolumeMl,
  productId: null,
})

const byProduct = (productId: string, group = 0): GiftCondition => ({
  type: 'PRODUCT',
  group,
  minSumMinor: null,
  kind: null,
  minVolumeMl: null,
  productId,
})

describe('earnedGiftCount', () => {
  it('SUM: порог не достигнут даёт 0, достигнут даёт 1', () => {
    const r = rule({ conditions: [sum(500_000)] })
    expect(earnedGiftCount(r, [], 499_999)).toBe(0)
    expect(earnedGiftCount(r, [], 500_000)).toBe(1)
  })

  it('шаг: по одному подарку за каждые stepMinor сверх порога, потолок maxGifts', () => {
    const r = rule({ conditions: [sum(500_000)], stepMinor: 250_000 })
    expect(earnedGiftCount(r, [], 500_000)).toBe(1)
    expect(earnedGiftCount(r, [], 749_999)).toBe(1)
    expect(earnedGiftCount(r, [], 750_000)).toBe(2)
    expect(earnedGiftCount(r, [], 1_000_000)).toBe(3)
    const capped = rule({ conditions: [sum(500_000)], stepMinor: 250_000, maxGifts: 2 })
    expect(earnedGiftCount(capped, [], 1_000_000)).toBe(2)
  })

  it('шаг считается от наибольшего выполненного SUM-порога', () => {
    // два порога в разных группах (ИЛИ); от меньшего подарков вышло бы больше
    const r = rule({ conditions: [sum(500_000, 0), sum(1_000_000, 1)], stepMinor: 250_000 })
    expect(earnedGiftCount(r, [], 1_000_000)).toBe(1)
    expect(earnedGiftCount(r, [], 1_250_000)).toBe(2)
  })

  it('группы: внутри И, между группами ИЛИ', () => {
    const cartWithTester = [line({ product: product({ kind: 'TESTER' }) })]
    const r = rule({
      conditions: [sum(500_000, 0), byKind('TESTER', null, 0), sum(2_000_000, 1)],
    })
    // в группе 0 сумма есть, а тестера нет; группа 1 не дотянула
    expect(earnedGiftCount(r, [], 600_000)).toBe(0)
    // группа 0 выполнена целиком
    expect(earnedGiftCount(r, cartWithTester, 600_000)).toBe(1)
    // хватает одной группы 1
    expect(earnedGiftCount(r, [], 2_000_000)).toBe(1)
  })

  it('KIND с minVolumeMl: наливные по млам строки, штучные по объёму товара', () => {
    const r = rule({ conditions: [byKind('SPLIT', 20)] })
    const pour = (ml: number) => line({ product: product({ kind: 'SPLIT', unit: 'ML' }), qty: ml })
    expect(earnedGiftCount(r, [pour(10)], 0)).toBe(0)
    expect(earnedGiftCount(r, [pour(20)], 0)).toBe(1)

    const rb = rule({ conditions: [byKind('BOTTLE', 100)] })
    expect(earnedGiftCount(rb, [line({ product: product({ volumeMl: 50 }) })], 0)).toBe(0)
    expect(earnedGiftCount(rb, [line({ product: product({ volumeMl: 100 }) })], 0)).toBe(1)
  })

  it('PRODUCT: подарочные строки условие не выполняют', () => {
    const r = rule({ conditions: [byProduct('x')] })
    const gift = line({ product: product({ id: 'x' }), isGift: true })
    const paid = line({ product: product({ id: 'x' }) })
    expect(earnedGiftCount(r, [gift], 0)).toBe(0)
    expect(earnedGiftCount(r, [paid], 0)).toBe(1)
  })

  it('без условий правило не срабатывает', () => {
    expect(earnedGiftCount(rule(), [], 1_000_000)).toBe(0)
  })
})

describe('usedGiftCount / giftOveruseRuleIds', () => {
  const giftLine = (ruleId: string, groupId: string) =>
    line({ isGift: true, giftRuleId: ruleId, giftGroupId: groupId, priceMinor: 0 })

  it('набор из нескольких строк считается одним подарком (счёт по группам)', () => {
    const cart = [giftLine('r1', 'g1'), giftLine('r1', 'g1'), giftLine('r1', 'g2')]
    expect(usedGiftCount(cart, 'r1')).toBe(2)
  })

  it('overuse: подарков больше, чем положено, или правило исчезло', () => {
    const r = rule({ id: 'r1', conditions: [sum(500_000)] })
    const cart = [line(), giftLine('r1', 'g1')]
    // сумма дотягивает
    expect(giftOveruseRuleIds(cart, [r], 500_000)).toEqual([])
    // сумму урезали, подарок больше не положен
    expect(giftOveruseRuleIds(cart, [r], 400_000)).toEqual(['r1'])
    // правило выключили или оно закончилось
    expect(giftOveruseRuleIds(cart, [], 500_000)).toEqual(['r1'])
  })
})
