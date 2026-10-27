import { adminFetch, archiveUrl, post, put, qs } from './core'

/** Код формы из справочника. От системных кодов зависит поведение, свои коды произвольные. */
export type ProductKind = string

export type ProductUnit = 'PCS' | 'ML'

/** Системные формы менять нельзя, свои можно добавлять. */
export interface ProductKindInfo {
  code: string
  name: string
  unit: ProductUnit
  system: boolean
  archived: boolean
  /** Можно ли выбрать форму позицией подарочного набора. */
  giftEligible: boolean
  /** lucide-иконка на карточке кассы; null: иконка по коду. */
  icon: string | null
  /** HEX-цвет акцента на карточке кассы; null: цвет по коду. */
  color: string | null
}

export function fetchProductKinds(includeArchived = false): Promise<ProductKindInfo[]> {
  return adminFetch(`/api/admin/product-kinds${qs({ includeArchived })}`)
}

export function createProductKind(data: {
  name: string
  unit: ProductUnit
  giftEligible: boolean
  icon?: string | null
  color?: string | null
}): Promise<ProductKindInfo> {
  return adminFetch('/api/admin/product-kinds', post(data))
}

/** Имя меняется только у несистемных форм. */
export function updateProductKind(
  code: string,
  data: { name: string; giftEligible: boolean; icon?: string | null; color?: string | null },
): Promise<ProductKindInfo> {
  return adminFetch(`/api/admin/product-kinds/${code}`, put(data))
}

export function toggleProductKindArchive(k: { code: string; archived: boolean }): Promise<ProductKindInfo> {
  return adminFetch(archiveUrl(`/api/admin/product-kinds/${k.code}`, k.archived), post())
}
