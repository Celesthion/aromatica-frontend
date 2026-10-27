import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { setTokenStorage } from '@/shared/api'

// токены в SecureStore: AsyncStorage хранит открытый текст и уходит в adb backup
const KEYS = ['storehub_token', 'storehub_refresh'] as const
// профиль не секрет, его достаточно держать в AsyncStorage
const USER_KEY = 'storehub_user'

// TokenStorage синхронный, поэтому держим токены в памяти и пишем на диск фоном
const cache = new Map<string, string>()

export function hasTokens(): boolean {
  return KEYS.some((key) => !!cache.get(key))
}

/** Профиль с прошлого запуска, чтобы не держать на заставке до ответа /me. */
export async function loadCachedUser<T>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveCachedUser(user: unknown): void {
  if (user === null) void AsyncStorage.removeItem(USER_KEY)
  else void AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

// старые установки хранили токены в AsyncStorage: переносим, чтобы не разлогинить при обновлении
async function migrateFromAsyncStorage(key: string): Promise<string | null> {
  const legacy = await AsyncStorage.getItem(key)
  if (!legacy) return null
  await SecureStore.setItemAsync(key, legacy)
  await AsyncStorage.removeItem(key)
  return legacy
}

/** Поднимает токены из SecureStore и подключает хранилище api-клиента. */
export async function hydrateTokens(): Promise<void> {
  await Promise.all(
    KEYS.map(async (key) => {
      const value = (await SecureStore.getItemAsync(key)) ?? (await migrateFromAsyncStorage(key))
      if (value) cache.set(key, value)
    }),
  )

  setTokenStorage({
    get: (key) => cache.get(key) ?? null,
    set: (key, value) => {
      if (value === null) {
        cache.delete(key)
        void SecureStore.deleteItemAsync(key)
      } else {
        cache.set(key, value)
        void SecureStore.setItemAsync(key, value)
      }
    },
  })
}
