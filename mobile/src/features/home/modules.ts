import type { GlyphName } from '~/components/Glyph'

interface ModuleDef {
  key: string
  label: string
  hint: string
  glyph: GlyphName
  /** Фон и цвет иконки на плитке Главной. */
  tint: string
  stroke: string
}

/** Модули, которых пока нет в мобилке: плитки на Главной и список в меню. */
export const OTHER_MODULES: ModuleDef[] = [
  { key: 'warehouse', label: 'Склад', hint: 'Скоро', glyph: 'warehouse', tint: '#e9eef0', stroke: '#567078' },
  { key: 'sales', label: 'Продажи', hint: 'Скоро', glyph: 'bag', tint: '#e9f0ea', stroke: '#52735a' },
  { key: 'catalog', label: 'Каталог', hint: 'Скоро', glyph: 'tag', tint: '#efe9f0', stroke: '#6f5878' },
  { key: 'finance', label: 'Финансы', hint: 'Скоро', glyph: 'banknote', tint: '#f0ece6', stroke: '#7a6a52' },
  { key: 'staff', label: 'Кадры', hint: 'Скоро', glyph: 'users', tint: '#eaeef2', stroke: '#566578' },
]
