import { minorToSom, parseDecimal, somToMinor } from '@/shared/lib/money'
import { newUuid } from '@/shared/lib/uuid'
import type { GiftConditionType, GiftOption, GiftRule, GiftRuleRequest, ProductUnit } from '@/shared/api'

/** Условие в форме: поля ввода до разбора. */
export interface FormCondition {
  key: string
  /** Группа условий: внутри И, между группами ИЛИ; пропуски в номерах сервер перенумерует. */
  group: number
  type: GiftConditionType
  sumSom: string
  kind: string
  minVolumeMl: string
  product: GiftOption | null
}

/** Позиция набора-подарка в форме. */
export interface FormItem {
  key: string
  kind: string
  unit: ProductUnit
  /** null: на кассе выдадут любой товар формы. */
  product: GiftOption | null
  qty: string
}

export interface GiftRuleFormState {
  id: string | null
  name: string
  items: FormItem[]
  conditions: FormCondition[]
  stepSom: string
  maxGifts: string
}

// разбирает "1 000,5" так же, как somToMinor
const num = (s: string) => parseDecimal(s.replace(/\s/g, ''))

export const newCondition = (group = 0): FormCondition => ({
  key: newUuid(),
  group,
  type: 'SUM',
  sumSom: '',
  kind: '',
  minVolumeMl: '',
  product: null,
})

export const newItem = (): FormItem => ({
  key: newUuid(),
  kind: '',
  unit: 'PCS',
  product: null,
  qty: '1',
})

export const emptyGiftRuleForm = (): GiftRuleFormState => ({
  id: null,
  name: '',
  items: [newItem()],
  conditions: [newCondition()],
  stepSom: '',
  maxGifts: '',
})

export function ruleToForm(r: GiftRule): GiftRuleFormState {
  return {
    id: r.id,
    name: r.name,
    items:
      r.items.length > 0
        ? r.items.map((it) => ({
            key: newUuid(),
            kind: it.kind ?? '',
            unit: (it.unit ?? 'PCS') as ProductUnit,
            product: it.productId ? { productId: it.productId, name: it.productName ?? it.productId } : null,
            qty: String(it.qty),
          }))
        : [newItem()],
    conditions:
      r.conditions.length > 0
        ? r.conditions.map((c) => ({
            key: newUuid(),
            group: c.group ?? 0,
            type: c.type,
            sumSom: c.minSumMinor != null ? minorToSom(c.minSumMinor) : '',
            kind: c.kind ?? '',
            minVolumeMl: c.minVolumeMl != null ? String(c.minVolumeMl) : '',
            product: c.productId ? { productId: c.productId, name: c.productName ?? c.productId } : null,
          }))
        : [newCondition()],
    stepSom: r.stepMinor != null ? minorToSom(r.stepMinor) : '',
    maxGifts: r.maxGifts != null ? String(r.maxGifts) : '',
  }
}

export function giftRuleToRequest(f: GiftRuleFormState): GiftRuleRequest {
  return {
    name: f.name.trim(),
    conditions: f.conditions.map((c) => ({
      type: c.type,
      group: c.group,
      minSumMinor: c.type === 'SUM' ? somToMinor(c.sumSom) : null,
      kind: c.type === 'KIND' ? c.kind || null : null,
      minVolumeMl: c.type === 'KIND' && c.minVolumeMl.trim() ? num(c.minVolumeMl) : null,
      productId: c.type === 'PRODUCT' ? (c.product?.productId ?? null) : null,
    })),
    stepMinor: f.stepSom.trim() ? somToMinor(f.stepSom) : null,
    maxGifts: f.maxGifts.trim() ? num(f.maxGifts) : null,
    items: f.items.map((it) => ({
      // выбран товар: дарим его, иначе любой товар формы
      productId: it.product?.productId ?? null,
      kind: it.product ? null : it.kind || null,
      qty: num(it.qty),
    })),
  }
}

function conditionValid(c: FormCondition): boolean {
  if (c.type === 'SUM') return (somToMinor(c.sumSom) ?? 0) > 0
  if (c.type === 'KIND') return c.kind !== '' && (c.minVolumeMl.trim() === '' || num(c.minVolumeMl) > 0)
  if (c.type === 'PRODUCT') return c.product != null
  return false
}

// штучные позиции только целым числом
const itemValid = (it: FormItem): boolean =>
  it.kind !== '' && num(it.qty) > 0 && (it.unit === 'ML' || Number.isInteger(num(it.qty)))

export function validateGiftRuleForm(f: GiftRuleFormState) {
  const conditionsOk = f.conditions.length > 0 && f.conditions.every(conditionValid)
  const giftOk = f.items.length > 0 && f.items.every(itemValid)
  const hasSumCondition = f.conditions.some((c) => c.type === 'SUM')
  const stepBad = f.stepSom.trim() !== '' && !((somToMinor(f.stepSom) ?? 0) > 0)
  const stepNeedsSum = f.stepSom.trim() !== '' && !hasSumCondition
  const maxGiftsBad = f.maxGifts.trim() !== '' && !(Number.isInteger(num(f.maxGifts)) && num(f.maxGifts) > 0)
  const invalid = !f.name.trim() || !conditionsOk || !giftOk || stepBad || stepNeedsSum || maxGiftsBad
  return { invalid, stepBad, stepNeedsSum, maxGiftsBad }
}

// номера непустых групп по возрастанию: группа без условий исчезает
export const groupNumbers = (f: GiftRuleFormState) =>
  [...new Set(f.conditions.map((c) => c.group))].sort((a, b) => a - b)
