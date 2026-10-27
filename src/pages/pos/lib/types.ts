import type { PosGiftRule, PosItem, PosProduct, ProductUnit } from '@/shared/api'

export type PayMethod = 'cash' | 'noCash'
/** При смешанной сумму делят в окне оплаты. */
export type PayChoice = PayMethod | 'mixed'

export interface CartLine {
  /** Ключ для React: индекс сдвигается при удалении групп. */
  lineId: string
  product: PosProduct
  qty: number
  priceMinor: number
  discountMinor: number
  isGift: boolean
  /** Упаковка: платная строка, в блоки чека и скидку на чек не входит. */
  isPackaging?: boolean
  /**
   * Разлив: доля масла в спрее, %. qty: мл масла, флакон клиента = qty * 100 / dilutionPct;
   * воду дописывает сервер.
   */
  dilutionPct?: number
  /** Общая метка масла и атомайзера одного флакона: по ней его откладывают на полку и возвращают целиком. */
  bundleId?: string
  /** Задан, когда позиция взята с полки, а не со склада смены. */
  warehouseId?: string
  giftRuleId?: string
  giftGroupId?: string
}

/** Набор-подарок, который ещё собирают: наливные позиции выбирают по очереди. */
export interface PendingBundle {
  rule: PosGiftRule
  groupId: string
  lines: CartLine[]
  queue: PosItem[]
}

/**
 * Карточка кассы: модель в одной форме, например Creed - Aventus · Флаконы, с объёмами внутри.
 * Конкретный вариант выбирают в окне.
 */
export interface ProductGroup {
  key: string
  kind: string
  title: string
  brand: string | null
  model: string
  variants: PosProduct[]
  totalQty: number
  /**
   * Насколько варианты ушли в минус, по модулю. Отдельно от totalQty, чтобы плюс одного варианта
   * не скрывал минус другого.
   */
  minusQty: number
  imageId: string | null
  unit: ProductUnit
}
