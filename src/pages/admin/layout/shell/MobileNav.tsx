import { Link } from '@tanstack/react-router'
import { CircleUserRound, Home, KeyRound, LogOut, Moon, Sun, X } from 'lucide-react'
import { Logo } from '@/shared/ui'
import { useTheme } from '@/shared/lib/theme'
import { isItemActive } from './modules'
import { visibleModules } from './routeAccess'

const MOBILE_ACTION =
  'flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground'

function mobileItemClass(active: boolean): string {
  return `flex items-center gap-2.5 rounded-full px-3 py-2 text-sm transition-colors ${
    active
      ? 'bg-primary font-medium text-primary-foreground'
      : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
  }`
}

/** Шторка со всеми разделами для телефона. */
export function MobileNav({
  role,
  pathname,
  isHome,
  showHome,
  userName,
  onClose,
  onChangePassword,
  onLogout,
}: {
  role: string
  pathname: string
  isHome: boolean
  showHome: boolean
  userName: string
  onClose: () => void
  onChangePassword: () => void
  onLogout: () => void
}) {
  const modules = visibleModules(role)
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-card p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <Logo className="[&_span]:text-[15px]" />
          <button
            type="button"
            onClick={onClose}
            title="Закрыть"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {showHome && (
            <Link to="/admin" onClick={onClose} className={mobileItemClass(isHome)}>
              <Home className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Главная
            </Link>
          )}
          {modules.map((m) => (
            <div key={m.key} className="pt-2">
              <p className="px-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground/70">{m.label}</p>
              {m.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={mobileItemClass(isItemActive(item, pathname))}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-3 border-t border-border pt-3">
          <p className="flex items-center gap-2 px-3 pb-1 text-xs text-muted-foreground">
            <CircleUserRound className="h-4 w-4" />
            {userName}
          </p>
          <button type="button" onClick={onChangePassword} className={MOBILE_ACTION}>
            <KeyRound className="h-4 w-4" />
            Сменить пароль
          </button>
          <ThemeToggle />
          <button type="button" onClick={onLogout} className={MOBILE_ACTION}>
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button type="button" onClick={toggle} className={MOBILE_ACTION}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? 'Светлая тема' : 'Тёмная тема'}
    </button>
  )
}
