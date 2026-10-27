import { API_BASE_URL } from '@/shared/api/http'
import {
  adminFetch,
  archiveUrl,
  del,
  type Paged,
  post,
  put,
  searchPaged,
  sortBody,
  type SortParam,
} from './core'
import type { ProductKind, ProductUnit } from './kinds'

export interface ProductModelSku {
  id: string
  name: string
  kind: ProductKind
  unit: ProductUnit
  volumeMl: number | null
  archived: boolean
}

export type ProductGender = 'MALE' | 'FEMALE' | 'UNISEX'

export interface ProductModel {
  id: string
  /** null: служебный продукт без бренда (упаковка и т.п.). */
  brand: string | null
  name: string
  description: string | null
  gender: ProductGender | null
  archived: boolean
  skus: ProductModelSku[]
  images: ProductImage[]
}

/** Фотография продукта. Все его формы показывают основную. */
export interface ProductImage {
  id: string
  main: boolean
  contentType: string
  sizeBytes: number
}

/** Ссылка на картинку: отдаётся без токена, поэтому годится прямо в <img src>. */
export function imageUrl(id: string): string {
  return `${API_BASE_URL}/api/images/${id}`
}

export function fetchProductModelImages(modelId: string): Promise<ProductImage[]> {
  return adminFetch(`/api/admin/product-models/${modelId}/images`)
}

/** Загрузка фотографии: multipart, файл в поле file. */
export function uploadProductModelImage(modelId: string, file: File): Promise<ProductImage> {
  const body = new FormData()
  body.append('file', file)
  return adminFetch(`/api/admin/product-models/${modelId}/images`, { method: 'POST', body })
}

export function makeProductModelImageMain(imageId: string): Promise<ProductImage> {
  return adminFetch(`/api/admin/product-models/images/${imageId}/main`, post())
}

export function deleteProductModelImage(imageId: string): Promise<void> {
  return adminFetch(`/api/admin/product-models/images/${imageId}`, del())
}

export interface ProductModelRequest {
  brand: string | null
  name: string
  description?: string | null
  gender?: ProductGender | null
}

/** Полная карточка со skus. */
export function fetchProductModel(id: string): Promise<ProductModel> {
  return adminFetch(`/api/admin/product-models/${id}`)
}

/** Строка списка продуктов: без форм, только их число. */
export interface ProductModelRow {
  id: string
  brand: string | null
  name: string
  description: string | null
  gender: ProductGender | null
  archived: boolean
  forms: number
  mainImageId: string | null
}

/** Лёгкий продукт для подбора в селекте товара. */
export interface ProductModelPick {
  id: string
  brand: string | null
  name: string
}

export function searchProductModels(q: string, page = 0): Promise<Paged<ProductModelPick>> {
  return searchPaged<ProductModelRow>('/api/admin/product-models/search', {
    page,
    size: 20,
    q: q || undefined,
  }).then((r) => ({
    ...r,
    items: r.items.map((m) => ({ id: m.id, brand: m.brand, name: m.name })),
  }))
}

export function fetchProductModelsPage(
  page = 0,
  q = '',
  includeArchived = false,
  sort?: SortParam,
): Promise<Paged<ProductModelRow>> {
  return searchPaged<ProductModelRow>('/api/admin/product-models/search', {
    page,
    size: 30,
    q: q || undefined,
    includeArchived,
    ...sortBody(sort),
  })
}

export function createProductModel(data: ProductModelRequest): Promise<ProductModel> {
  return adminFetch('/api/admin/product-models', post(data))
}

export function updateProductModel(id: string, data: ProductModelRequest): Promise<ProductModel> {
  return adminFetch(`/api/admin/product-models/${id}`, put(data))
}

export function toggleProductModelArchive(m: { id: string; archived: boolean }): Promise<ProductModel> {
  return adminFetch(archiveUrl(`/api/admin/product-models/${m.id}`, m.archived), post())
}
