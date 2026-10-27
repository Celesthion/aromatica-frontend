import { describe, expect, it } from 'vitest'
import type { PosProduct } from '@/shared/api'
import { groupProducts, groupTitle } from './grouping'
import { makeProduct } from './testing/fixtures'

const product = (over: Partial<PosProduct>) => makeProduct({ name: 'Имя', priceMinor: 1000, qty: 1, ...over })

describe('groupProducts', () => {
  it('группирует по модели и форме, складывает остатки', () => {
    const list = [
      product({ modelId: 'm1', kind: 'BOTTLE', brand: 'Creed', model: 'Aventus', qty: 2 }),
      product({ modelId: 'm1', kind: 'BOTTLE', brand: 'Creed', model: 'Aventus', qty: 3 }),
      product({ modelId: 'm1', kind: 'TESTER', brand: 'Creed', model: 'Aventus', qty: 1 }),
    ]
    const groups = groupProducts(list)
    expect(groups).toHaveLength(2)
    const bottles = groups.find((g) => g.kind === 'BOTTLE')!
    expect(bottles.variants).toHaveLength(2)
    expect(bottles.totalQty).toBe(5)
    expect(bottles.title).toBe('Creed — Aventus')
  })

  it('минус варианта не съедает плюс другого, копится отдельно', () => {
    const list = [
      product({ modelId: 'm1', kind: 'BOTTLE', brand: 'Creed', model: 'Aventus', qty: 3 }),
      product({ modelId: 'm1', kind: 'BOTTLE', brand: 'Creed', model: 'Aventus', qty: -2 }),
    ]
    const g = groupProducts(list)[0]
    // если сложить, вышла бы 1, хотя на полке три флакона
    expect(g.totalQty).toBe(3)
    expect(g.minusQty).toBe(2)
  })

  it('без бренда заголовок это просто модель (упаковка, атомайзеры)', () => {
    const p = product({
      modelId: 'm2',
      kind: 'PACKAGING',
      brand: null,
      model: 'Коробка',
      name: 'Коробка · Упаковка · Обычная',
    })
    expect(groupTitle(p)).toBe('Коробка')
    const g = groupProducts([p])[0]
    expect(g.brand).toBeNull()
    expect(g.model).toBe('Коробка')
  })

  it('без полей модели заголовок берётся из имени, группировка не разваливается', () => {
    const legacy = product({ kind: 'BOTTLE', name: 'Creed — Aventus · Флакон · 50 мл' })
    expect(groupTitle(legacy)).toBe('Creed — Aventus')
    const g = groupProducts([legacy])[0]
    expect(g.brand).toBe('Creed')
    expect(g.model).toBe('Aventus')
  })

  it('превью группы это первое непустое фото варианта', () => {
    const list = [
      product({ modelId: 'm3', kind: 'BOTTLE', mainImageId: null }),
      product({ modelId: 'm3', kind: 'BOTTLE', mainImageId: 'img-1' }),
    ]
    expect(groupProducts(list)[0].imageId).toBe('img-1')
  })
})
