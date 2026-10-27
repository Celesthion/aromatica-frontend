import { describe, expect, it } from 'vitest'
import { canAccessPath, homePath, visibleModules } from './routeAccess'

describe('доступ к истории смен', () => {
  it('открыта администратору', () => {
    expect(canAccessPath('ADMIN', '/admin/shifts')).toBe(true)
  })

  it('закрыта всем остальным ролям', () => {
    for (const role of ['SELLER', 'SENIOR_SELLER', 'MERCHANDISER', 'ONLINE_MANAGER']) {
      expect(canAccessPath(role, '/admin/shifts')).toBe(false)
    }
  })

  it('пункта «Смены» нет в меню у старшего продавца', () => {
    const items = visibleModules('SENIOR_SELLER').flatMap((m) => m.items.map((i) => i.to))
    expect(items).not.toContain('/admin/shifts')
    // без терминала роль осталась бы без кассы
    expect(items).toContain('/admin/pos')
  })

  it('старшего продавца при входе ведём в терминал, а не в закрытые смены', () => {
    expect(homePath('SENIOR_SELLER')).toBe('/admin/pos')
    expect(canAccessPath('SENIOR_SELLER', homePath('SENIOR_SELLER'))).toBe(true)
  })

  it('домашняя страница каждой роли ей доступна', () => {
    for (const role of ['ADMIN', 'SELLER', 'SENIOR_SELLER', 'MERCHANDISER', 'ONLINE_MANAGER']) {
      expect(canAccessPath(role, homePath(role))).toBe(true)
    }
  })
})
