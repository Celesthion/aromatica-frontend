import { Link } from '@tanstack/react-router'
import { Home, Menu, type LucideIcon } from 'lucide-react'
import { ACTIVE_PILL, Logo, Tooltip } from '@/shared/ui'
import { useSlidingPill } from '@/shared/lib/useSlidingPill'
import { moduleForPath } from './modules'
import { railItemClass } from './navStyles'
import { ProfileMenu } from './ProfileMenu'
import { visibleModules } from './routeAccess'

const ROUND_BTN =
  'grid h-11 w-11 place-items-center rounded-full border border-glass-line bg-glass text-muted-foreground shadow-soft-sm backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-glass-hover hover:text-foreground'

/** Верхняя шапка: бургер и лого, вкладки модулей, меню профиля. */
export function TopNav({
  role,
  userName,
  pathname,
  isHome,
  showHome,
  onOpenMobile,
  onChangePassword,
  onLogout,
}: {
  role: string
  userName: string
  pathname: string
  isHome: boolean
  showHome: boolean
  onOpenMobile: () => void
  onChangePassword: () => void
  onLogout: () => void
}) {
  const modules = visibleModules(role)
  const activeKey = moduleForPath(pathname)?.key

  // сетка 1fr auto 1fr держит вкладки по центру при любой ширине краёв
  return (
    <header className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 pb-3 pt-1 sm:pl-0 sm:pr-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpenMobile} title="Меню" className={`${ROUND_BTN} lg:hidden`}>
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/admin" title="На главную" className="hidden shrink-0 items-center pl-4 sm:flex">
          <Logo />
        </Link>
      </div>

      <SlidingTabs
        activeKey={isHome ? 'home' : (activeKey ?? '')}
        tabs={[
          ...(showHome ? [{ key: 'home', label: 'Главная', to: '/admin', icon: Home }] : []),
          ...modules.map((m) => ({ key: m.key, label: m.label, to: m.items[0].to, icon: m.icon })),
        ]}
      />

      <div className="hidden justify-end sm:flex">
        <ProfileMenu
          userName={userName}
          role={role}
          onChangePassword={onChangePassword}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}

/** Вкладки модулей со скользящей подложкой. */
function SlidingTabs({
  tabs,
  activeKey,
}: {
  tabs: { key: string; label: string; to: string; icon: LucideIcon }[]
  activeKey: string
}) {
  const { navRef, setItemRef, rect } = useSlidingPill<HTMLElement>(activeKey, {
    deps: tabs.length,
  })

  return (
    <nav ref={navRef} className="relative hidden items-center gap-1.5 lg:flex" aria-label="Модули">
      {rect && <span aria-hidden className={ACTIVE_PILL} style={rect} />}
      {tabs.map((tab) => {
        const TabIcon = tab.icon
        return (
          <Tooltip key={tab.key} label={tab.label} side="bottom">
            <Link
              to={tab.to}
              aria-label={tab.label}
              // "Главная" - префикс всех путей админки, поэтому активна только при точном совпадении
              activeOptions={{ exact: tab.key === 'home' }}
              ref={setItemRef(tab.key)}
              className={railItemClass(tab.key === activeKey)}
            >
              <TabIcon className="h-5 w-5" strokeWidth={1.6} />
            </Link>
          </Tooltip>
        )
      })}
    </nav>
  )
}
