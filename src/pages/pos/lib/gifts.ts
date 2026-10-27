import type { PosGiftRule } from '@/shared/api'
import type { CartLine } from './types'

type GiftCondition = PosGiftRule['conditions'][number]

/** Подарочные строки условие не выполняют. */
function isConditionMet(c: GiftCondition, cart: CartLine[], totalMinor: number): boolean {
  if (c.type === 'SUM') return c.minSumMinor != null && totalMinor >= c.minSumMinor
  if (c.type === 'PRODUCT') return cart.some((l) => !l.isGift && l.product.id === c.productId)
  if (c.type === 'KIND')
    return cart.some((l) => {
      if (l.isGift || l.product.kind !== c.kind) return false
      if (c.minVolumeMl == null) return true
      // у наливных объём - налитые мл строки, у штучных - объём товара
      return l.product.unit === 'ML' ? l.qty >= c.minVolumeMl : (l.product.volumeMl ?? 0) >= c.minVolumeMl
    })
  return false
}

/**
 * Сколько подарков положено по правилу. Условия внутри группы связаны по И, между группами
 * по ИЛИ. Сверх порога суммы даём ещё по подарку за каждые stepMinor, но не больше maxGifts.
 * totalMinor - платная сумма до скидки на чек: скидка на чек на пороги не влияет.
 */
export function earnedGiftCount(r: PosGiftRule, cart: CartLine[], totalMinor: number): number {
  if (r.conditions.length === 0) return 0
  const groups = [...new Set(r.conditions.map((c) => c.group ?? 0))]
  const matched = groups.some((g) =>
    r.conditions.filter((c) => (c.group ?? 0) === g).every((c) => isConditionMet(c, cart, totalMinor)),
  )
  if (!matched) return 0
  let n = 1
  // шаг считаем от наибольшего выполненного SUM-порога: от первого попавшегося подарков вышло бы больше
  const sums = r.conditions.flatMap((c) =>
    c.type === 'SUM' && c.minSumMinor != null && totalMinor >= c.minSumMinor ? [c.minSumMinor] : [],
  )
  const sumBase = sums.length > 0 ? Math.max(...sums) : null
  if (sumBase != null && r.stepMinor != null && r.stepMinor > 0) {
    n += Math.max(0, Math.floor((totalMinor - sumBase) / r.stepMinor))
  }
  return r.maxGifts != null ? Math.min(n, r.maxGifts) : n
}

/** Считаем наборы, а не строки. */
export function usedGiftCount(cart: CartLine[], ruleId: string): number {
  return new Set(cart.filter((l) => l.giftRuleId === ruleId).map((l) => l.giftGroupId)).size
}

/**
 * Правила, по которым подарков в чеке больше, чем положено: корзину урезали после выдачи
 * или акция закончилась. Такие подарки надо убрать перед оплатой.
 */
export function giftOveruseRuleIds(cart: CartLine[], rules: PosGiftRule[], totalMinor: number): string[] {
  const cartRuleIds = [...new Set(cart.flatMap((l) => (l.isGift && l.giftRuleId ? [l.giftRuleId] : [])))]
  return cartRuleIds.filter((id) => {
    const r = rules.find((x) => x.id === id)
    return !r || usedGiftCount(cart, id) > earnedGiftCount(r, cart, totalMinor)
  })
}
