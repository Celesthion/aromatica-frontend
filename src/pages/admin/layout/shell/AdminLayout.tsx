import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@/shared/ui'
import { logout, me, queryKeys } from '@/shared/api'
import { AdminChromeContext } from '@/shared/lib/adminChrome'
import { ChangePasswordDialog } from '@/pages/admin/staff/ChangePasswordDialog'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { FastViewContext } from '@/pages/admin/layout/fastViewContext'
import { MobileNav } from './MobileNav'
import { moduleForPath } from './modules'
import { canAccessPath, homePath } from './routeAccess'
import { SubRail } from './SubRail'
import { TopNav } from './TopNav'
import { useBrowserFullscreen } from './useBrowserFullscreen'

/** Каркас админки: проверка сессии, шапка с вкладками модулей, колонка разделов и лист с содержимым. */
export function AdminLayout() {
  const queryClient = useQueryClient()
  const session = useQuery({
    queryKey: queryKeys.me,
    queryFn: me,
    retry: false,
    staleTime: 5 * 60_000,
  })

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (session.isError || !session.data) {
    return <LoginScreen onSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.admin })} />
  }

  return <AdminShell userName={session.data.displayName ?? session.data.login} role={session.data.role} />
}

function AdminShell({ userName, role }: { userName: string; role: string }) {
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeModule = moduleForPath(pathname)
  const isHome = pathname === '/admin'
  const isPos = pathname === '/admin/pos'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const exit = useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin }),
  })

  // касса прячет шапку и колонку разделов своей кнопкой, а не по факту открытой смены
  const [fullscreen, setFullscreen] = useState(false)
  const { browserFullscreen, setBrowserFullscreen, browserFullscreenBlocked } = useBrowserFullscreen()
  const chrome = useMemo(
    () => ({ fullscreen, setFullscreen, browserFullscreen, setBrowserFullscreen, browserFullscreenBlocked }),
    [fullscreen, browserFullscreen, setBrowserFullscreen, browserFullscreenBlocked],
  )
  const immersive = isPos && fullscreen

  // slot: цель портала фаст-вью
  const [fastViewOpen, setFastViewOpen] = useState(false)
  const [fastViewSlot, setFastViewSlot] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    setMobileOpen(false)
    if (pathname !== '/admin/pos') setFullscreen(false)
    setFastViewOpen(false)
  }, [pathname])

  if (!canAccessPath(role, pathname)) {
    return <Navigate to={homePath(role)} />
  }

  const showHome = canAccessPath(role, '/admin')
  const subItems = activeModule ? activeModule.items.filter((i) => canAccessPath(role, i.to)) : []
  // в полном экране терминал без полей и скруглений, но на том же стекле
  const sheetShape = immersive
    ? 'overflow-hidden bg-gradient-to-b from-sheet-from to-sheet-to backdrop-blur-xl backdrop-saturate-150'
    : 'rounded-[24px] border border-sheet-line bg-gradient-to-b from-sheet-from to-sheet-to shadow-sheet backdrop-blur-xl backdrop-saturate-150'
  // у терминала своя прокрутка, остальные страницы прокручиваются внутри листа
  const sheetScroll = isPos ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 sm:px-6 sm:py-5'

  return (
    <FastViewContext.Provider value={{ slot: fastViewSlot, setOpen: setFastViewOpen }}>
      <AdminChromeContext.Provider value={chrome}>
        <div className="relative flex h-screen flex-col overflow-hidden">
          {!immersive && (
            <TopNav
              role={role}
              userName={userName}
              pathname={pathname}
              isHome={isHome}
              showHome={showHome}
              onOpenMobile={() => setMobileOpen(true)}
              onChangePassword={() => setPasswordOpen(true)}
              onLogout={() => exit.mutate()}
            />
          )}

          <div className="flex min-h-0 min-w-0 flex-1">
            {!immersive && <SubRail items={subItems} pathname={pathname} />}

            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
              <main className={`min-h-0 flex-1 ${immersive ? 'p-0' : 'px-3 pb-3 pt-1 sm:pl-0 sm:pr-4'}`}>
                <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row lg:items-stretch">
                  <div
                    className={`relative h-full min-w-0 flex-1 transition-[flex-basis] duration-300 ${sheetShape} ${sheetScroll} ${
                      fastViewOpen ? 'lg:basis-[70%]' : 'lg:basis-full'
                    }`}
                  >
                    <Outlet />
                  </div>
                  <div
                    ref={setFastViewSlot}
                    className={`lg:basis-[30%] ${
                      fastViewOpen
                        ? 'fixed inset-0 z-50 flex flex-col bg-secondary/60 p-3 backdrop-blur-sm lg:static lg:z-auto lg:w-full lg:bg-transparent lg:p-0 lg:backdrop-blur-none'
                        : 'hidden'
                    }`}
                  />
                </div>
              </main>
            </div>
          </div>

          {mobileOpen && (
            <MobileNav
              role={role}
              pathname={pathname}
              isHome={isHome}
              showHome={showHome}
              userName={userName}
              onClose={() => setMobileOpen(false)}
              onChangePassword={() => {
                setMobileOpen(false)
                setPasswordOpen(true)
              }}
              onLogout={() => exit.mutate()}
            />
          )}
          {passwordOpen && <ChangePasswordDialog onClose={() => setPasswordOpen(false)} />}
        </div>
      </AdminChromeContext.Provider>
    </FastViewContext.Provider>
  )
}
