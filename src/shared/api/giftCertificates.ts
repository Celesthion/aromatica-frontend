import { adminFetch, post, qs, searchPaged, type Paged } from './core'

// Сертификат: обязательство магазина. Продажа не выручка, выручка появляется при погашении.

export type GiftStatus = 'NEW' | 'ACTIVE' | 'USED' | 'BLOCKED'

export interface GiftCertificate {
  id: string
  code: string
  nominalMinor: number
  /** У непроданного сертификата 0. */
  balanceMinor: number
  status: GiftStatus
  comment: string | null
  soldAt: string | null
  soldBy: string | null
  /** Покупатель, а не тот, кто предъявит: сертификат обычно дарят. */
  buyerId: string | null
  buyerName: string | null
  buyerPhone: string | null
}

/** Минус: погашение, плюс: возврат на сертификат. */
export interface GiftUse {
  docId: string
  amountMinor: number
  at: string
}

/** Проверка кода на кассе перед оплатой. */
export interface GiftCheck {
  payable: boolean
  /** Почему платить нельзя; null: можно. */
  reason: string | null
  id: string | null
  code: string
  nominalMinor: number
  balanceMinor: number
  status: GiftStatus | null
}

/** Считается в базе, а не по загруженной странице реестра. */
export interface GiftStats {
  /** Непогашенные остатки проданных сертификатов, долг магазина товаром. */
  liabilityMinor: number
  inStock: number
  total: number
}

/** q ищет по подстроке кода, имени или телефона покупателя. */
export function searchGiftCertificates(
  q: string,
  status: GiftStatus | undefined,
  page: number,
): Promise<Paged<GiftCertificate>> {
  return searchPaged<GiftCertificate>('/api/admin/gift-certificates/search', {
    page,
    size: 30,
    q: q || undefined,
    status,
  })
}

export function fetchGiftStats(): Promise<GiftStats> {
  return adminFetch('/api/admin/gift-certificates/stats')
}

/** Партия бланков: система выдаёт 12-значные коды с контрольной цифрой, печатают их отдельно. */
export function generateGiftBatch(data: {
  count: number
  nominalMinor: number
  comment?: string
}): Promise<GiftCertificate[]> {
  return adminFetch('/api/admin/gift-certificates/batch/generate', post(data))
}

export function blockGiftCertificate(id: string, comment: string): Promise<GiftCertificate> {
  return adminFetch(`/api/admin/gift-certificates/${id}/block`, post({ comment }))
}

export function fetchGiftHistory(id: string): Promise<GiftUse[]> {
  return adminFetch(`/api/admin/gift-certificates/${id}/history`)
}

export function checkGiftCertificate(code: string): Promise<GiftCheck> {
  return adminFetch(`/api/pos/gift-certificates/check${qs({ code })}`)
}

/** Деньги идут в кассу, но не в выручку: это аванс. */
export function sellGiftCertificate(
  shiftId: string,
  data: { code: string; cashMinor: number; noCashMinor: number; customerId: string },
): Promise<GiftCertificate> {
  return adminFetch(`/api/pos/shifts/${shiftId}/gift-certificates/sell`, post(data))
}
