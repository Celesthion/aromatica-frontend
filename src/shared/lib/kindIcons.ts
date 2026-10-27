import {
  Box,
  Boxes,
  Container,
  Droplet,
  Droplets,
  FlaskConical,
  FlaskRound,
  Gift,
  GlassWater,
  Heart,
  Package,
  PackageOpen,
  ShoppingBag,
  Sparkles,
  SprayCan,
  Star,
  Tag,
  TestTube,
  TestTubes,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import { FALLBACK_KIND_ICON_NAME, kindIconName } from './kinds'

/**
 * Иконки форм товара: админ выбирает иконку для формы, касса рисует её на карточке.
 * В справочнике лежит имя иконки, здесь оно сопоставляется с компонентом. Список закрытый:
 * иконку вне набора не отрисовать.
 */
export const KIND_ICONS: Record<string, LucideIcon> = {
  FlaskRound,
  FlaskConical,
  TestTube,
  TestTubes,
  Droplet,
  Droplets,
  SprayCan,
  Wine,
  GlassWater,
  Package,
  PackageOpen,
  Box,
  Boxes,
  Container,
  ShoppingBag,
  Gift,
  Sparkles,
  Star,
  Heart,
  Tag,
}

/** Имена иконок для сетки-пикера в админке. */
export const KIND_ICON_NAMES = Object.keys(KIND_ICONS)

/** Компонент иконки по имени; неизвестное или пустое имя заменяется ярлыком. */
function resolveKindIcon(name?: string | null): LucideIcon {
  return (name && KIND_ICONS[name]) || KIND_ICONS[FALLBACK_KIND_ICON_NAME]
}

/** Иконка формы для карточки; icon - выбор админа в справочнике, он важнее системной. */
export const kindIcon = (kind: string, icon?: string | null) => resolveKindIcon(kindIconName(kind, icon))
