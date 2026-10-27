import { adminFetch, del, post, put } from './core'
import type { ProductKind, ProductUnit } from './kinds'

export interface GiftOption {
  productId: string
  name: string
}

/** Сумма чека, форма товара или конкретный товар. */
export type GiftConditionType = 'SUM' | 'KIND' | 'PRODUCT'

/**
 * Условие акции. По type заполнено одно поле: SUM: minSumMinor, KIND: kind (и minVolumeMl),
 * PRODUCT: productId. productName приходит только в админском DTO. Условия одной group связаны
 * "И", группы между собой "ИЛИ".
 */
export interface GiftCondition {
  type: GiftConditionType
  group: number
  minSumMinor: number | null
  kind: ProductKind | null
  minVolumeMl: number | null
  productId: string | null
  productName?: string | null
}

/**
 * Позиция набора-подарка: конкретный товар или (productId null) любой товар формы kind,
 * его выбирают на кассе. qty в единице формы.
 */
export interface GiftItem {
  productId: string | null
  productName?: string | null
  kind: ProductKind | null
  kindName?: string | null
  unit?: ProductUnit | null
  qty: number
}

/** stepMinor: +1 подарок за каждые N сверх порога SUM-условия; maxGifts: потолок на чек. */
export interface GiftRule {
  id: string
  name: string
  conditions: GiftCondition[]
  stepMinor: number | null
  maxGifts: number | null
  items: GiftItem[]
  active: boolean
}

export interface GiftConditionRequest {
  type: GiftConditionType
  group: number
  minSumMinor: number | null
  kind: string | null
  minVolumeMl: number | null
  productId: string | null
}

export interface GiftItemRequest {
  productId: string | null
  kind: string | null
  qty: number
}

export interface GiftRuleRequest {
  name: string
  conditions: GiftConditionRequest[]
  stepMinor: number | null
  maxGifts: number | null
  items: GiftItemRequest[]
}

export function fetchGiftRules(): Promise<GiftRule[]> {
  return adminFetch('/api/admin/gift-rules')
}

export function createGiftRule(data: GiftRuleRequest): Promise<GiftRule> {
  return adminFetch('/api/admin/gift-rules', post(data))
}

export function updateGiftRule(id: string, data: GiftRuleRequest): Promise<GiftRule> {
  return adminFetch(`/api/admin/gift-rules/${id}`, put(data))
}

export function toggleGiftRule(id: string): Promise<GiftRule> {
  return adminFetch(`/api/admin/gift-rules/${id}/toggle`, post())
}

export function deleteGiftRule(id: string): Promise<void> {
  return adminFetch(`/api/admin/gift-rules/${id}`, del())
}
