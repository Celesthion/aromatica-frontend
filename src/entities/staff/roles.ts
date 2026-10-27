import type { Role } from '@/shared/api'

/** Названия ролей для интерфейса. */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  SELLER: 'Продавец',
  MERCHANDISER: 'Товаровед',
  SENIOR_SELLER: 'Старший продавец',
  ONLINE_MANAGER: 'Онлайн-менеджер',
}

/** Роли в селектах сотрудников, от простой к полной. */
export const ASSIGNABLE_ROLES: Role[] = ['SELLER', 'SENIOR_SELLER', 'MERCHANDISER', 'ONLINE_MANAGER', 'ADMIN']

/** Роли, привязанные к конкретным складам: им показываем доступ к складам. */
export function roleUsesWarehouses(role: string): boolean {
  return role === 'SELLER' || role === 'SENIOR_SELLER' || role === 'MERCHANDISER'
}

/** Кто может открыть смену в кассе (закрыть может любой, кто видит терминал). */
export function canOpenShift(role: string): boolean {
  return role === 'ADMIN' || role === 'SENIOR_SELLER'
}
