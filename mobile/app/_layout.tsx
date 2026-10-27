import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { UnauthorizedError } from '@/shared/api'
import { LoginScreen } from '~/features/auth/LoginScreen'
import { useSession } from '~/features/auth/session'
import { useTheme, useThemeMode } from '~/hooks/useTheme'

// сессия умерла: api-клиент уже стёр токены, переходим на вход
function onApiError(error: unknown) {
  if (error instanceof UnauthorizedError) useSession.getState().expire()
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // в зале пропадает Wi-Fi, а сервер после простоя просыпается не сразу
      retry: (count, error) => !(error instanceof UnauthorizedError) && count < 2,
    },
  },
  queryCache: new QueryCache({ onError: onApiError }),
  mutationCache: new MutationCache({ onError: onApiError }),
})

export default function RootLayout() {
  const [fontsReady] = useFonts({ TenorSans: require('../assets/fonts/TenorSans-Regular.ttf') })
  const ready = useSession((s) => s.ready)
  const user = useSession((s) => s.user)
  const start = useSession((s) => s.start)
  const hydrateTheme = useThemeMode((s) => s.hydrate)
  const t = useTheme()

  useEffect(() => {
    void start()
    void hydrateTheme()
  }, [start, hydrateTheme])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={t.isDark ? 'light' : 'dark'} />
          {!ready || !fontsReady ? (
            <View style={{ flex: 1, backgroundColor: t.background, justifyContent: 'center' }}>
              <ActivityIndicator color={t.ink} />
            </View>
          ) : user ? (
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.background } }} />
          ) : (
            <LoginScreen />
          )}
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
