import type { CounterpartyType, DocStatus, DocType } from '@/shared/api'

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  SUPPLY: 'Приёмка',
  SALE: 'Продажа',
  WRITE_OFF: 'Списание',
  SURPLUS: 'Оприходование',
  INVENTORY: 'Инвентаризация',
  MOVE: 'Перемещение',
  CONVERT: 'Вскрытие',
  RETURN: 'Возврат',
  RETURN_SUPPLY: 'Возврат поставщику',
  ASSEMBLY: 'Сборка',
  DISASSEMBLY: 'Разборка',
}

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  DRAFT: 'Черновик',
  POSTED: 'Проведён',
  CANCELLED: 'Отменён',
}

export const COUNTERPARTY_TYPE_LABELS: Record<CounterpartyType, string> = {
  SUPPLIER: 'Поставщик',
  CUSTOMER: 'Покупатель',
}

export const PRODUCT_GENDER_LABELS = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  UNISEX: 'Унисекс',
} as const

// без бренда (служебные продукты вроде упаковки) только название
export function modelTitle(brand: string | null | undefined, name: string): string {
  return brand ? `${brand} — ${name}` : name
}
