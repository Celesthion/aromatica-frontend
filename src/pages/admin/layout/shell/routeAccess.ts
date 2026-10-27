import { ADMIN_MODULES, matchesPath, type AdminModule } from './modules'

// разделы, доступные роли; '*' значит все
const ROLE_ROUTES: Record<string, string[] | '*'> = {
  ADMIN: '*',
  SELLER: ['/admin/pos'],
  MERCHANDISER: [
    '/admin/stock',
    '/admin/supplies',
    '/admin/adjustments',
    '/admin/moves',
    '/admin/counterparties',
    '/admin/warehouses',
    '/admin/products',
    '/admin/product-models',
    '/admin/brands',
    '/admin/kinds',
  ],
  // история смен только у ADMIN (выручка и чужие смены), старшему продавцу хватает X-отчёта в терминале
  SENIOR_SELLER: ['/admin/pos', '/admin/sales', '/admin/returns', '/admin/reports'],
  ONLINE_MANAGER: [
    '/admin/products',
    '/admin/product-models',
    '/admin/brands',
    '/admin/kinds',
    '/admin/sales',
    '/admin/returns',
  ],
}

/** Куда отправить сотрудника после входа или при попытке открыть недоступную страницу. */
export function homePath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'MERCHANDISER':
      return '/admin/stock'
    case 'SENIOR_SELLER':
      return '/admin/pos'
    case 'ONLINE_MANAGER':
      return '/admin/products'
    default:
      return '/admin/pos'
  }
}

export function canAccessPath(role: string, pathname: string): boolean {
  const routes = ROLE_ROUTES[role] ?? []
  if (routes === '*') return true
  // главная только для ADMIN: её карточки ходят в эндпоинты, закрытые для остальных ролей
  if (pathname === '/admin') return false
  return routes.some((base) => matchesPath(base, pathname))
}

/** Модули с пунктами, доступными роли; модуль без таких пунктов не показывается. */
export function visibleModules(role: string): AdminModule[] {
  const routes = ROLE_ROUTES[role] ?? []
  if (routes === '*') return ADMIN_MODULES
  return ADMIN_MODULES.map((m) => ({
    ...m,
    items: m.items.filter((i) => routes.some((base) => matchesPath(base, i.to))),
  })).filter((m) => m.items.length > 0)
}
