import { adminFetch, post, put } from './core'

export interface WarehouseInfo {
  id: string
  name: string
  address: string | null
  isDefault: boolean
  archived: boolean
  /** STORE: склад магазина, SHELF: его полка (возвраты и налитое из чека). */
  kind?: 'STORE' | 'SHELF'
  parentId?: string | null
}

export function fetchWarehouses(): Promise<WarehouseInfo[]> {
  return adminFetch('/api/admin/warehouses')
}

export function createWarehouse(name: string, address?: string | null): Promise<WarehouseInfo> {
  return adminFetch('/api/admin/warehouses', post({ name, address: address ?? null }))
}

export function updateWarehouse(
  id: string,
  data: { name: string; address?: string | null },
): Promise<WarehouseInfo> {
  return adminFetch(`/api/admin/warehouses/${id}`, put({ name: data.name, address: data.address ?? null }))
}

export function makeWarehouseDefault(id: string): Promise<WarehouseInfo> {
  return adminFetch(`/api/admin/warehouses/${id}/default`, post())
}

export function archiveWarehouse(id: string): Promise<WarehouseInfo> {
  return adminFetch(`/api/admin/warehouses/${id}/archive`, post())
}
