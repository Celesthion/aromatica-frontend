/**
 * Значок и цвет формы товара на карточке. Только данные без компонентов: веб берёт иконки
 * из lucide-react, мобилка из lucide-react-native, а соответствия общие.
 */

/** Значок системной формы, когда в справочнике он не задан. */
const KIND_ICON_NAME_BY_CODE: Record<string, string> = {
  BOTTLE: 'FlaskRound',
  TESTER: 'TestTube',
  SPLIT: 'Droplet',
  BULK: 'Droplets',
  ATOMIZER: 'SprayCan',
  PACKAGING: 'Package',
  GOODS: 'Tag',
  KIT: 'Boxes',
  READY: 'PackageCheck',
}

/** Цвет-акцент системной формы, когда в справочнике он не задан. */
const KIND_ACCENT: Record<string, string> = {
  BOTTLE: '#8091ad',
  TESTER: '#9b8ec9',
  SPLIT: '#c39a63',
  BULK: '#c39a63',
  ATOMIZER: '#78a892',
  PACKAGING: '#78a892',
  GOODS: '#9aa3b2',
  KIT: '#c39a63',
  READY: '#78a892',
}

const DEFAULT_KIND_ACCENT = '#9aa3b2'

export const FALLBACK_KIND_ICON_NAME = 'Tag'

/** Цвет формы: выбранный админом, затем системный, затем нейтральный. */
export function kindAccent(code: string, color?: string | null): string {
  return color ?? KIND_ACCENT[code] ?? DEFAULT_KIND_ACCENT
}

/** Имя значка формы: выбранное админом, затем системное, затем ярлык. */
export function kindIconName(code: string, icon?: string | null): string {
  return icon || KIND_ICON_NAME_BY_CODE[code] || FALLBACK_KIND_ICON_NAME
}
