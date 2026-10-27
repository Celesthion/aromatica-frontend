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
} from 'lucide-react-native'
import { kindIconName } from '@/shared/lib/kinds'

// имена иконок общие с вебом (shared/lib/kinds), здесь только компоненты lucide-react-native
const KIND_ICONS: Record<string, LucideIcon> = {
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

/** Иконка формы: выбранная в справочнике, иначе по коду. */
export function kindIcon(code: string, icon?: string | null): LucideIcon {
  return KIND_ICONS[kindIconName(code, icon)] ?? Tag
}
