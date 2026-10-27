/** Палитры light и dark с одинаковыми токенами: экраны берут цвета через useTheme(). */
export interface Palette {
  background: string
  card: string
  /** Второй тон поверхности: подложка превью, счётчики. */
  cardAlt: string
  ink: string
  muted: string
  border: string
  /** Цены и ссылки. */
  accent: string
  danger: string
  /** Светлый тон для текста и заливок на тёмной карте. */
  cream: string
  white: string
  primary: string
  primaryText: string
  field: string
  /** Тёмная карта, одинаковая в обеих темах. */
  dark: string
  shadowColor: string
  shadowOpacity: number
  /** Карточка витрины: подложка, кромка, фон превью и подписей. */
  tile: string
  tileEdge: string
  thumb: string
  caption: string
  /** Блик на карточке, три остановки градиента. */
  sheen: [string, string, string]
  /** Метки на фото: число вариантов и остаток. */
  badge: string
  badgeInk: string
}

export const light: Palette = {
  background: '#ebedf2',
  card: 'rgba(255,255,255,0.62)',
  cardAlt: '#e9ecf1',
  ink: '#1b1d22',
  muted: '#7d818a',
  border: '#dfe3ea',
  accent: '#7c8698',
  danger: '#c0604f',
  cream: '#f4f5f7',
  white: '#ffffff',
  primary: '#1b1d22',
  primaryText: '#f4f5f7',
  field: '#ffffff',
  dark: '#1a1b20',
  shadowColor: '#1b1d22',
  shadowOpacity: 0.1,
  tile: 'rgba(255,255,255,0.55)',
  tileEdge: 'rgba(255,255,255,0.85)',
  thumb: 'rgba(255,255,255,0.4)',
  caption: 'rgba(255,255,255,0.8)',
  sheen: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.28)'],
  badge: 'rgba(27,29,34,0.85)',
  badgeInk: '#ffffff',
}

export const dark: Palette = {
  background: '#101114',
  card: '#1d1e24',
  cardAlt: '#25262d',
  ink: '#ece9e2',
  muted: '#83848b',
  border: 'rgba(212,192,145,0.18)',
  accent: '#d9c491',
  danger: '#d8776a',
  cream: '#f2ead7',
  white: '#ffffff',
  primary: '#d9c491',
  primaryText: '#17140c',
  field: '#1d1e24',
  dark: '#1a1b20',
  shadowColor: '#000000',
  shadowOpacity: 0.45,
  tile: 'rgba(29,30,36,0.92)',
  tileEdge: 'rgba(212,192,145,0.14)',
  thumb: 'rgba(255,255,255,0.03)',
  caption: 'rgba(26,27,32,0.94)',
  sheen: ['rgba(232,217,180,0.08)', 'rgba(255,255,255,0.02)', 'rgba(232,217,180,0.05)'],
  badge: 'rgba(212,192,145,0.92)',
  badgeInk: '#17140c',
}

/** Tenor Sans для заголовков, сумм и логотипа. */
export const font = { display: 'TenorSans' } as const

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const

export const space = (n: number) => n * 4

/** Тень карточки: shadow* для iOS, elevation для Android. */
export const shadow = {
  shadowColor: '#465064',
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const
