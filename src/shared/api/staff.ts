import {
  adminFetch,
  archiveUrl,
  fetchSliced,
  type Paged,
  post,
  put,
  qs,
  searchPaged,
  type Sliced,
  sortBody,
  type SortParam,
} from './core'
import type { Role } from './auth'

/** Документ, смена или задача одной строкой в ленте активности. */
export interface ActivityItem {
  /** Определяет иконку. */
  kind: 'doc' | 'shift' | 'task'
  /** Раздел для фильтра. */
  section: 'pos' | 'warehouse' | 'money' | 'task'
  action: string
  title: string
  at: string
}

/** Без section: все разделы. */
export function fetchUserActivity(
  id: string,
  section?: ActivityItem['section'],
  page = 0,
  size = 10,
): Promise<Sliced<ActivityItem>> {
  return fetchSliced<ActivityItem>(`/api/admin/users/${id}/activity${qs({ page, size, section })}`)
}

export interface StaffUser {
  id: string
  login: string
  displayName: string | null
  role: Role
  archived: boolean
  createdAt: string
  warehouseIds: string[]
}

export interface StaffFilters {
  search?: string
  role?: Role
  includeArchived?: boolean
}

export function fetchUsers(
  page = 0,
  filters: StaffFilters = {},
  sort?: SortParam,
  size = 30,
): Promise<Paged<StaffUser>> {
  return searchPaged<StaffUser>('/api/admin/users/search', {
    page,
    size,
    q: filters.search || undefined,
    role: filters.role,
    includeArchived: filters.includeArchived,
    ...sortBody(sort),
  })
}

export function createUser(data: {
  login: string
  password: string
  displayName?: string
  role: Role
  warehouseIds?: string[]
}): Promise<StaffUser> {
  return adminFetch('/api/admin/users', post(data))
}

export function updateUser(
  id: string,
  data: {
    displayName?: string
    role?: Role
    password?: string
    warehouseIds?: string[]
  },
): Promise<StaffUser> {
  return adminFetch(`/api/admin/users/${id}`, put(data))
}

export function toggleUserArchive(u: { id: string; archived: boolean }): Promise<StaffUser> {
  return adminFetch(archiveUrl(`/api/admin/users/${u.id}`, u.archived), post())
}

export function changeOwnPassword(current: string, next: string): Promise<void> {
  return adminFetch('/api/auth/password', post({ current, next }))
}
