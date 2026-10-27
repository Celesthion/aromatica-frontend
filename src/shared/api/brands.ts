import { adminFetch, archiveUrl, type Paged, post, put, searchPaged, sortBody, type SortParam } from './core'

export interface Brand {
  id: string
  name: string
  archived: boolean
}

export interface BrandPick {
  id: string
  name: string
}

export interface BrandRequest {
  name: string
}

export function searchBrands(q: string, page = 0): Promise<Paged<BrandPick>> {
  return searchPaged<Brand>('/api/admin/brands/search', { page, size: 20, q: q || undefined }).then((r) => ({
    ...r,
    items: r.items.map((b) => ({ id: b.id, name: b.name })),
  }))
}

export function fetchBrandsPage(
  page = 0,
  q = '',
  includeArchived = false,
  sort?: SortParam,
): Promise<Paged<Brand>> {
  return searchPaged<Brand>('/api/admin/brands/search', {
    page,
    size: 30,
    q: q || undefined,
    includeArchived,
    ...sortBody(sort),
  })
}

export function createBrand(data: BrandRequest): Promise<Brand> {
  return adminFetch('/api/admin/brands', post(data))
}

export function updateBrand(id: string, data: BrandRequest): Promise<Brand> {
  return adminFetch(`/api/admin/brands/${id}`, put(data))
}

export function toggleBrandArchive(b: { id: string; archived: boolean }): Promise<Brand> {
  return adminFetch(archiveUrl(`/api/admin/brands/${b.id}`, b.archived), post())
}
