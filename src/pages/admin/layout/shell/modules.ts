import {
  Gift,
  Shapes,
  ArrowRightLeft,
  Banknote,
  ClipboardCheck,
  Package,
  PackagePlus,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tags,
  Ticket,
  TrendingUp,
  Users,
  UsersRound,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

export interface AdminModuleItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface AdminModule {
  key: string
  label: string
  icon: LucideIcon
  /** Первый пункт открывается по вкладке модуля. */
  items: AdminModuleItem[]
}

/** Модули админки. */
export const ADMIN_MODULES: AdminModule[] = [
  {
    key: 'warehouse',
    label: 'Склад',
    icon: Warehouse,
    items: [
      { to: '/admin/stock', label: 'Остатки', icon: Warehouse },
      { to: '/admin/supplies', label: 'Приёмки', icon: PackagePlus },
      { to: '/admin/adjustments', label: 'Корректировки', icon: ClipboardCheck },
      { to: '/admin/moves', label: 'Перемещения', icon: ArrowRightLeft },
      { to: '/admin/counterparties', label: 'Контрагенты', icon: UsersRound },
      { to: '/admin/warehouses', label: 'Склады', icon: Warehouse },
    ],
  },
  {
    key: 'sales',
    label: 'Продажи',
    icon: ShoppingBag,
    items: [
      { to: '/admin/sales', label: 'Продажи', icon: ShoppingCart },
      { to: '/admin/returns', label: 'Возвраты', icon: RotateCcw },
    ],
  },
  {
    key: 'catalog',
    label: 'Каталог',
    icon: Package,
    items: [
      { to: '/admin/products', label: 'Товары', icon: Package },
      { to: '/admin/product-models', label: 'Модели', icon: Sparkles },
      { to: '/admin/brands', label: 'Бренды', icon: Tags },
      { to: '/admin/kinds', label: 'Формы', icon: Shapes },
      { to: '/admin/gift-rules', label: 'Подарки', icon: Gift },
    ],
  },
  {
    key: 'finance',
    label: 'Финансы',
    icon: Banknote,
    items: [
      { to: '/admin/money', label: 'Деньги', icon: Banknote },
      { to: '/admin/gift-certificates', label: 'Сертификаты', icon: Ticket },
      { to: '/admin/reports', label: 'Отчёты', icon: TrendingUp },
    ],
  },
  {
    key: 'staff',
    label: 'Кадры',
    icon: Users,
    items: [{ to: '/admin/staff', label: 'Сотрудники', icon: Users }],
  },
  {
    key: 'pos',
    label: 'Касса',
    icon: Store,
    items: [
      { to: '/admin/pos', label: 'Терминал', icon: Store },
      { to: '/admin/shifts', label: 'Смены', icon: ClipboardCheck },
    ],
  },
]

/** Путь совпадает с разделом или вложен в него (редактор документа и т. п.). */
export function matchesPath(base: string, pathname: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`)
}

/** Модуль текущего пути; при нескольких совпадениях выигрывает самый длинный пункт. */
export function moduleForPath(pathname: string): AdminModule | null {
  let best: { module: AdminModule; len: number } | null = null
  for (const module of ADMIN_MODULES) {
    for (const item of module.items) {
      if (matchesPath(item.to, pathname) && (!best || item.to.length > best.len)) {
        best = { module, len: item.to.length }
      }
    }
  }
  return best?.module ?? null
}

export function isItemActive(item: AdminModuleItem, pathname: string): boolean {
  return matchesPath(item.to, pathname)
}
