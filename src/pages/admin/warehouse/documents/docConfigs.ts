import { ArrowRightLeft, type LucideIcon } from 'lucide-react'
import type { DocEditorConfig } from './DocEditor'

/** Тип документа: настройки редактора и то, что нужно списку и разделу. */
interface DocSectionConfig extends DocEditorConfig {
  /** Подпись таба, если в разделе несколько типов. */
  tabLabel?: string
  /** Кнопка создания, если отличается от titleNew. */
  newLabel?: string
  emptyText: string
  emptyIcon?: LucideIcon
  /** Без заголовка колонки контрагента нет. */
  listCounterpartyHeader?: string
  sumHeader?: string
}

export const DOC_CONFIGS = {
  SUPPLY: {
    type: 'SUPPLY',
    titleNew: 'Новая приёмка',
    titleOf: (n: number) => `Приёмка №${n}`,
    counterparty: 'SUPPLIER',
    counterpartyLabel: 'Поставщик',
    showPrice: true,
    noDiscount: true,
    priceLabel: 'Цена закупки, с',
    payment: 'account',
    emptyText: 'Приёмок ещё нет — создайте первую',
    listCounterpartyHeader: 'Поставщик',
  },
  SALE: {
    type: 'SALE',
    titleNew: 'Новая продажа',
    titleOf: (n: number) => `Продажа №${n}`,
    counterparty: 'CUSTOMER',
    counterpartyLabel: 'Покупатель',
    showPrice: true,
    priceLabel: 'Цена продажи, с',
    prefillPrice: true,
    payment: 'split',
    hint: 'Себестоимость спишется автоматически по текущей средней; остаток может уйти в минус — продажа не блокируется.',
    emptyText: 'Продаж ещё нет',
    listCounterpartyHeader: 'Покупатель',
  },
  MOVE: {
    type: 'MOVE',
    titleNew: 'Новое перемещение',
    titleOf: (n: number) => `Перемещение №${n}`,
    showPrice: false,
    emptyText: 'Перемещений ещё нет',
    emptyIcon: ArrowRightLeft,
    sumHeader: 'Сумма (себест.)',
  },
  WRITE_OFF: {
    type: 'WRITE_OFF',
    titleNew: 'Новое списание',
    titleOf: (n: number) => `Списание №${n}`,
    showPrice: false,
    hint: 'Списывается по текущей средней себестоимости — итог документа посчитается при проведении.',
    tabLabel: 'Списания',
    emptyText: 'Списаний ещё нет',
  },
  SURPLUS: {
    type: 'SURPLUS',
    titleNew: 'Новое оприходование',
    titleOf: (n: number) => `Оприходование №${n}`,
    showPrice: true,
    priceLabel: 'Себестоимость, с',
    hint: 'Цена — себестоимость оприходуемого; оставьте 0, чтобы взять текущую среднюю.',
    tabLabel: 'Оприходования',
    emptyText: 'Оприходований ещё нет',
  },
  INVENTORY: {
    type: 'INVENTORY',
    titleNew: 'Новая инвентаризация',
    titleOf: (n: number) => `Инвентаризация №${n}`,
    showPrice: false,
    qtyLabel: 'Факт. остаток',
    hint: 'Строки — фактические остатки по складу. При проведении система сама спишет недостачу или оприходует излишек.',
    tabLabel: 'Инвентаризации',
    emptyText: 'Инвентаризаций ещё нет',
  },
  RETURN: {
    type: 'RETURN',
    titleNew: 'Новый возврат от покупателя',
    titleOf: (n: number) => `Возврат №${n}`,
    counterparty: 'CUSTOMER',
    counterpartyLabel: 'Покупатель',
    showPrice: true,
    priceLabel: 'Цена возврата, с',
    prefillPrice: true,
    payment: 'split',
    hint: 'Товар вернётся на склад по текущей средней себестоимости; сумма документа — деньги, которые возвращаем покупателю (спишутся со счетов по разбивке).',
    tabLabel: 'От покупателей',
    newLabel: 'Новый возврат',
    emptyText: 'Возвратов ещё нет',
    listCounterpartyHeader: 'Покупатель',
  },
  RETURN_SUPPLY: {
    type: 'RETURN_SUPPLY',
    titleNew: 'Новый возврат поставщику',
    titleOf: (n: number) => `Возврат поставщику №${n}`,
    counterparty: 'SUPPLIER',
    counterpartyLabel: 'Поставщик',
    showPrice: true,
    priceLabel: 'Цена возврата, с',
    payment: 'account',
    hint: 'Товар спишется по средней себестоимости; если указан счёт — деньги от поставщика придут на него.',
    tabLabel: 'Поставщикам',
    newLabel: 'Возврат поставщику',
    emptyText: 'Возвратов поставщикам ещё нет',
    listCounterpartyHeader: 'Поставщик',
  },
} satisfies Record<string, DocSectionConfig>

export type ConfiguredDocType = keyof typeof DOC_CONFIGS

// satisfies сохраняет литералы, наружу отдаём широкий тип
export function docConfig(type: ConfiguredDocType): DocSectionConfig {
  return DOC_CONFIGS[type]
}
