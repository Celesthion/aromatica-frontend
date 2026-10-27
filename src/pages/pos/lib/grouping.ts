import type { PosProduct } from '@/shared/api'
import type { ProductGroup } from './types'

/** Заголовок карточки: бренд и модель через тире, без полей модели - часть имени до формы. */
export function groupTitle(p: PosProduct): string {
  if (p.brand && p.model) return `${p.brand} — ${p.model}`
  return p.name.split(' · ')[0]
}

function brandModel(p: PosProduct): { brand: string | null; model: string } {
  if (p.brand && p.model) return { brand: p.brand, model: p.model }
  // нет полей модели: делим заголовок по тире между брендом и моделью
  const title = groupTitle(p)
  const sep = title.indexOf(' — ')
  return sep >= 0
    ? { brand: title.slice(0, sep), model: title.slice(sep + 3) }
    : { brand: null, model: title }
}

/** Карточка на каждую пару модель и форма. */
export function groupProducts(list: PosProduct[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>()
  for (const p of list) {
    // старый бэк не присылает modelId, тогда группируем по заголовку
    const key = `${p.modelId ?? groupTitle(p)}::${p.kind}`
    let g = map.get(key)
    if (!g) {
      g = {
        key,
        kind: p.kind,
        title: groupTitle(p),
        ...brandModel(p),
        variants: [],
        totalQty: 0,
        minusQty: 0,
        imageId: p.mainImageId,
        unit: p.unit,
      }
      map.set(key, g)
    }
    g.variants.push(p)
    g.totalQty += Math.max(0, p.qty)
    g.minusQty += Math.max(0, -p.qty)
    if (!g.imageId && p.mainImageId) g.imageId = p.mainImageId
  }
  return [...map.values()]
}
