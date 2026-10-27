import { create } from 'zustand'
import { login as apiLogin, logout as apiLogout, me, UnauthorizedError, type AdminUser } from '@/shared/api'
import { hasTokens, hydrateTokens, loadCachedUser, saveCachedUser } from './tokens'

interface SessionState {
  user: AdminUser | null
  /** false, пока не подняли токены с диска. */
  ready: boolean
  start: () => Promise<void>
  signIn: (login: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Refresh не сработал: показать вход без запроса к бэкенду. */
  expire: () => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  ready: false,

  async start() {
    await hydrateTokens()

    if (!hasTokens()) {
      set({ user: null, ready: true })
      return
    }

    // пускаем с прошлым профилем, а /me уточняет в фоне: сервер мог ещё не проснуться
    const cached = await loadCachedUser<AdminUser>()
    set({ user: cached, ready: true })

    try {
      const fresh = await me()
      saveCachedUser(fresh)
      set({ user: fresh })
    } catch (e) {
      // на вход выкидывает только протухший доступ, сетевую ошибку переживаем
      if (e instanceof UnauthorizedError) {
        saveCachedUser(null)
        set({ user: null })
      }
    }
  },

  async signIn(login, password) {
    const user = await apiLogin(login, password)
    saveCachedUser(user)
    set({ user })
  },

  async signOut() {
    try {
      await apiLogout()
    } finally {
      saveCachedUser(null)
      set({ user: null })
    }
  },

  expire() {
    saveCachedUser(null)
    set({ user: null })
  },
}))

/** Имя сотрудника для шапок и чека: отображаемое, а если его нет, логин. */
export function staffName(user: AdminUser | null | undefined): string {
  return user?.displayName ?? user?.login ?? ''
}
