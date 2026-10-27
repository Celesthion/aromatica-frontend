import { Outlet, ScrollRestoration } from '@tanstack/react-router'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
