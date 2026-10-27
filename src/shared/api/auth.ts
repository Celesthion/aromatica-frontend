import { adminFetch, getRefreshToken, post, setTokens } from './core'

/** Совпадают с AppUser.Role на бэке. */
export type Role = 'ADMIN' | 'SELLER' | 'MERCHANDISER' | 'SENIOR_SELLER' | 'ONLINE_MANAGER'

export interface AdminUser {
  id: string | null
  login: string
  displayName: string | null
  role: Role
}

export async function login(loginName: string, password: string): Promise<AdminUser> {
  const res = await adminFetch<{ accessToken: string; refreshToken: string; user: AdminUser }>(
    '/api/auth/login',
    post({ login: loginName, password }),
  )
  setTokens(res.accessToken, res.refreshToken)
  return res.user
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  try {
    // отзываем refresh на сервере, короткий access истечёт сам
    await adminFetch('/api/auth/logout', post(refreshToken ? { refreshToken } : undefined))
  } finally {
    setTokens(null, null)
  }
}

export function me(): Promise<AdminUser> {
  return adminFetch('/api/auth/me')
}
