import { useMemo } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { dark, light, type Palette } from '~/theme'

type ThemeMode = 'system' | 'light' | 'dark'

export type Theme = Palette & { isDark: boolean }

const KEY = 'storehub_theme'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  hydrate: () => Promise<void>
}

export const useThemeMode = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    void AsyncStorage.setItem(KEY, mode)
    set({ mode })
  },
  async hydrate() {
    const saved = await AsyncStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') set({ mode: saved })
  },
}))

/** Палитра текущей темы; по умолчанию как в системе. */
export function useTheme(): Theme {
  const mode = useThemeMode((s) => s.mode)
  const system = useColorScheme()
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark'
  return useMemo(() => ({ ...(isDark ? dark : light), isDark }), [isDark])
}

/** StyleSheet экрана, пересобранный под текущую тему. */
export function useStyles<T>(makeStyles: (t: Theme) => T): T {
  const t = useTheme()
  return useMemo(() => makeStyles(t), [makeStyles, t])
}
