import { useEffect, useRef, useState } from 'react'
import { CircleUserRound, KeyRound, LogOut, Maximize2, Minimize2, Moon, Sun } from 'lucide-react'
import { Tooltip } from '@/shared/ui'
import { useTheme } from '@/shared/lib/theme'
import { useAdminChrome } from '@/shared/lib/adminChrome'
import { ROLE_LABELS } from '@/entities/staff/roles'
import { RAIL_BTN } from './navStyles'

const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-foreground/90 transition-colors hover:bg-glass-hover hover:text-foreground'

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

/** Меню профиля: имя и роль, пароль, тема, полный экран, выход. */
export function ProfileMenu({
  userName,
  role,
  onChangePassword,
  onLogout,
}: {
  userName: string
  role: string
  onChangePassword: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const chrome = useAdminChrome()
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  const initials = initialsOf(userName)

  return (
    <div ref={box} className="relative">
      <Tooltip label={open ? '' : 'Профиль'} side="bottom">
        <button
          type="button"
          aria-label="Профиль"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`${RAIL_BTN} ${open ? 'bg-glass-hover text-foreground' : ''}`}
        >
          {initials ? (
            <span className="text-[12px] font-medium tracking-wide">{initials}</span>
          ) : (
            <CircleUserRound className="h-[21px] w-[21px]" strokeWidth={1.5} />
          )}
        </button>
      </Tooltip>
      {open && (
        <div
          role="menu"
          className="absolute z-50 w-64 animate-fade-up rounded-2xl border border-glass-edge bg-glass-panel p-2 shadow-soft backdrop-blur-xl backdrop-saturate-150 right-0 top-full mt-2"
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/25 text-sm font-medium text-foreground">
              {initials || <CircleUserRound className="h-5 w-5" strokeWidth={1.5} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{userName}</span>
              <span className="block text-xs text-muted-foreground">{ROLE_LABELS[role] ?? role}</span>
            </span>
          </div>
          <div className="my-1 h-px bg-glass-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onChangePassword()
            }}
            className={MENU_ITEM}
          >
            <KeyRound className="h-4 w-4" strokeWidth={1.7} />
            Сменить пароль
          </button>
          <button type="button" role="menuitem" onClick={toggle} className={MENU_ITEM}>
            {dark ? (
              <Sun className="h-4 w-4" strokeWidth={1.7} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.7} />
            )}
            {dark ? 'Дневная тема' : 'Ночная тема'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              chrome.setBrowserFullscreen(!chrome.browserFullscreen)
            }}
            className={`${MENU_ITEM} ${chrome.browserFullscreenBlocked ? 'text-brand-warn hover:text-brand-warn' : ''}`}
            title={
              chrome.browserFullscreenBlocked
                ? 'Браузер не дал полный экран — нажмите ⌃⌘F (Mac) или F11'
                : undefined
            }
          >
            {chrome.browserFullscreen ? (
              <Minimize2 className="h-4 w-4" strokeWidth={1.7} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={1.7} />
            )}
            {chrome.browserFullscreen ? 'Выйти из полного экрана' : 'На весь экран'}
          </button>
          <div className="my-1 h-px bg-glass-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className={`${MENU_ITEM} text-brand-bad hover:text-brand-bad`}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.7} />
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
