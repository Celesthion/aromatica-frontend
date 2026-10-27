import { minorToSom, somToMinorOr0 } from '@/shared/lib/money'
import type { AdminProduct, ProductKind, ProductRequest } from '@/shared/api'
import { modelTitle } from '@/pages/admin/lib/labels'

interface ComponentRow {
  productId: string
  name: string
  qty: string
}

export interface ProductFormState {
  id: string | null // null = создание
  label: string // отличие варианта: цвет и т. п.
  priceSom: string
  description: string
  modelId: string
  modelLabel: string // подпись продукта, чтобы не грузить список ради неё
  kind: ProductKind
  volumeMl: string
  /** Состав комплекта на одну штуку, только у KIT. */
  components: ComponentRow[]
}

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  id: null,
  label: '',
  priceSom: '',
  description: '',
  modelId: '',
  modelLabel: '',
  kind: 'GOODS',
  volumeMl: '',
  components: [],
}

const parseQty = (s: string) => parseFloat(s.replace(',', '.')) || 0

export function productToForm(p: AdminProduct): ProductFormState {
  return {
    id: p.id,
    label: p.label ?? '',
    priceSom: p.priceKopecks != null ? minorToSom(p.priceKopecks) : '',
    description: p.description ?? '',
    modelId: p.modelId ?? '',
    modelLabel: p.modelName ? modelTitle(p.modelBrand, p.modelName) : '',
    kind: p.kind,
    volumeMl: p.volumeMl != null ? String(p.volumeMl) : '',
    components: (p.components ?? []).map((c) => ({
      productId: c.productId,
      name: c.name,
      qty: String(c.qty),
    })),
  }
}

export function productFormToRequest(f: ProductFormState): ProductRequest {
  return {
    label: f.label.trim() || null,
    priceKopecks: f.priceSom ? somToMinorOr0(f.priceSom) : null,
    description: f.description || null,
    modelId: f.modelId || null,
    kind: f.kind,
    volumeMl: f.volumeMl ? parseFloat(f.volumeMl) : null,
    // у остальных форм сервер состав не принимает
    components:
      f.kind === 'KIT'
        ? f.components.map((c) => ({ productId: c.productId, qty: parseQty(c.qty) }))
        : undefined,
  }
}

/** У каждой строки состава количество больше нуля. */
export function componentsValid(f: ProductFormState): boolean {
  if (f.kind !== 'KIT') return true
  return f.components.length > 0 && f.components.every((c) => parseQty(c.qty) > 0)
}

// имя собирается как на сервере: продукт, форма, отличие, объём; форму GOODS не пишем
export function composeName({
  modelLabel,
  kind,
  kindName,
  label,
  volumeMl,
}: {
  modelLabel: string
  kind: ProductKind
  kindName: string
  label: string
  volumeMl: string
}): string {
  const parts: string[] = []
  if (modelLabel) parts.push(modelLabel)
  if (kind !== 'GOODS' && kindName) parts.push(kindName)
  if (label.trim()) parts.push(label.trim())
  if (volumeMl.trim()) parts.push(`${volumeMl.trim()} мл`)
  return parts.join(' · ')
}
