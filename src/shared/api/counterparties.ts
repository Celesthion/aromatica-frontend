import { adminFetch, type Paged, post, put, searchPaged, sortBody, type SortParam } from './core'

/** Тип управляет поведением: приёмка предлагает поставщиков, продажа покупателей. */
export type CounterpartyType = 'SUPPLIER' | 'CUSTOMER'

/** Пол физлица; null: не указан (у организаций его нет). */
export type CounterpartyGender = 'MALE' | 'FEMALE'

export interface Counterparty {
  id: string
  name: string
  type: CounterpartyType
  /** Обязателен при создании и правке; у старых записей бывает пустым. */
  phone: string | null
  gender: CounterpartyGender | null
  /** Дата рождения, ISO `гггг-мм-дд`, для поздравлений и возрастных акций. */
  birthDate: string | null
  note: string | null
  archived: boolean
}

/** Контрагенты для селекта в документе и для списка. */
export function searchCounterparties(
  q: string,
  type?: CounterpartyType,
  page = 0,
  sort?: SortParam,
): Promise<Paged<Counterparty>> {
  return searchPaged<Counterparty>('/api/admin/counterparties/search', {
    page,
    size: 20,
    q: q || undefined,
    type,
    ...sortBody(sort),
  })
}

export function createCounterparty(data: {
  name: string
  type: CounterpartyType
  phone: string
  gender?: CounterpartyGender | null
  birthDate?: string | null
  note?: string
}): Promise<Counterparty> {
  return adminFetch('/api/admin/counterparties', post(data))
}

export function updateCounterparty(
  id: string,
  data: {
    name: string
    type: CounterpartyType
    phone: string
    gender?: CounterpartyGender | null
    birthDate?: string | null
    note?: string | null
  },
): Promise<Counterparty> {
  return adminFetch(`/api/admin/counterparties/${id}`, put(data))
}

export function archiveCounterparty(id: string): Promise<void> {
  return adminFetch(`/api/admin/counterparties/${id}/archive`, post())
}
