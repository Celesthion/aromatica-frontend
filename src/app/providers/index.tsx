import type { ReactNode } from 'react'
import { QueryProvider } from './query'

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>
}
