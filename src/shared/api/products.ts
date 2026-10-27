import { adminFetch, archiveUrl, type Paged, post, put, searchPaged, sortBody, type SortParam } from './core'
import type { ProductKind, ProductUnit } from './kinds'

export interface AdminProduct {
  id: string
  /** Полное имя: сервер собирает его из продукта, формы, label и объёма. */
  name: string
  /** Отличие варианта (цвет и т. п.), необязательное третье поле. */
  label: string | null
  article: string | null
  priceKopecks: number | null
  description: string | null
  archived: boolean
  modelId: string | null
  modelBrand: string | null
  modelName: string | null
  kind: ProductKind
  unit: ProductUnit
  volumeMl: number | null
  /** Основное фото продукта, к которому относится товар (своих фото у товара нет). */
  mainImageId: string | null
  /** Состав комплекта или готового; у остальных форм пусто. */
  components: ProductComponentInfo[]
}

/** Строка состава: составляющая с именем и количеством на одну штуку. */
export interface ProductComponentInfo {
  productId: string
  name: string
  qty: number
  unit: ProductUnit | null
  kind: ProductKind | null
}

export interface ProductComponentRequest {
  productId: string
  qty: number
}

export interface ProductRequest {
  /** Отличие варианта (необязательно): цвет и т.п. Имя собирается автоматически. */
  label?: string | null
  priceKopecks?: number | null
  description?: string | null
  modelId?: string | null
  kind?: ProductKind
  unit?: ProductUnit | null
  volumeMl?: number | null
  /** Состав только у комплекта (KIT). */
  components?: ProductComponentRequest[]
}

export function fetchAllProducts(
  page = 0,
  q = '',
  includeArchived = false,
  sort?: SortParam,
): Promise<Paged<AdminProduct>> {
  return searchPaged<AdminProduct>('/api/admin/products/search', {
    page,
    size: 30,
    q: q || undefined,
    includeArchived,
    ...sortBody(sort),
  })
}

export function createProduct(data: ProductRequest): Promise<AdminProduct> {
  return adminFetch('/api/admin/products', post(data))
}

export function updateProduct(id: string, data: ProductRequest): Promise<AdminProduct> {
  return adminFetch(`/api/admin/products/${id}`, put(data))
}

/** archived: текущее состояние; архивный товар вернётся, активный уйдёт в архив. */
export function toggleProductArchive(p: { id: string; archived: boolean }): Promise<AdminProduct> {
  return adminFetch(archiveUrl(`/api/admin/products/${p.id}`, p.archived), post())
}

export interface ProductPick {
  id: string
  name: string
  article: string | null
  priceKopecks: number | null
  unit: ProductUnit
  kind: ProductKind
}

/** Товары для подбора; kind: необязательный фильтр по форме. */
export function searchProducts(search: string, kind?: string, page = 0): Promise<Paged<ProductPick>> {
  return searchPaged<AdminProduct>('/api/admin/products/search', {
    page,
    size: 20,
    q: search || undefined,
    kind: kind || undefined,
  }).then((r) => ({
    ...r,
    items: r.items.map((p) => ({
      id: p.id,
      name: p.name,
      article: p.article,
      priceKopecks: p.priceKopecks,
      unit: p.unit,
      kind: p.kind,
    })),
  }))
}
