import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { light as colors } from '~/theme'

export type GlyphName =
  | 'menu'
  | 'home'
  | 'store'
  | 'clock'
  | 'exit'
  | 'search'
  | 'close'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'receipt'
  | 'warehouse'
  | 'bag'
  | 'tag'
  | 'banknote'
  | 'users'
  | 'chevronRight'
  | 'gift'
  | 'pause'
  | 'bookmark'
  | 'box'
  | 'userPlus'
  | 'user'
  | 'card'
  | 'mix'
  | 'check'
  | 'sun'
  | 'moon'

const PATHS: Record<GlyphName, string[]> = {
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5', 'M9.5 21v-6h5v6'],
  store: ['M3 9 5 4h14l2 5', 'M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z', 'M9 20v-6h6v6'],
  clock: ['M12 7v5l3 2'],
  exit: ['M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3', 'M10 8l-4 4 4 4', 'M6 12h9'],
  search: ['M20 20l-3.5-3.5'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  trash: ['M4 7h16', 'M9 7V5h6v2', 'M6 7l1 13h10l1-13', 'M10 11v6', 'M14 11v6'],
  receipt: ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 8h6', 'M9 12h6'],
  warehouse: ['M3 21V9l9-6 9 6v12', 'M9 21v-8h6v8'],
  bag: ['M6 2 3 6v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'],
  tag: ['M20.6 13.4 12 22l-9-9V3h10z'],
  banknote: [],
  users: ['M3 20a6 6 0 0 1 12 0', 'M16 5.5a3 3 0 0 1 0 5', 'M18 20a6 6 0 0 0-3-5.2'],
  chevronRight: ['M9 6l6 6-6 6'],
  gift: [
    'M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z',
    'M3 7h18v4H3z',
    'M12 7v14',
    'M12 7C10.5 4 9 3 7.6 3.6 6.2 4.2 6.4 6.3 8 7z',
    'M12 7c1.5-3 3-4 4.4-3.4 1.4.6 1.2 2.7-.4 3.4z',
  ],
  pause: ['M9 5v14', 'M15 5v14'],
  bookmark: ['M6 3h12v18l-6-4-6 4z'],
  box: ['M3 8l9-5 9 5v8l-9 5-9-5z', 'M3 8l9 5 9-5', 'M12 13v10'],
  userPlus: ['M3 20a6 6 0 0 1 12 0', 'M18 8v6', 'M15 11h6'],
  user: ['M4 20a6 6 0 0 1 12 0'],
  card: ['M3 10h18', 'M6.5 15h4'],
  mix: ['M4 8h9a4 4 0 0 1 0 8H4', 'M17 5l3 3-3 3', 'M7 13l-3 3 3 3'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  sun: [
    'M12 2.5v2.2',
    'M12 19.3v2.2',
    'M4.2 4.2l1.6 1.6',
    'M18.2 18.2l1.6 1.6',
    'M2.5 12h2.2',
    'M19.3 12h2.2',
    'M4.2 19.8l1.6-1.6',
    'M18.2 5.8l1.6-1.6',
  ],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'],
}

type RectShape = { x: number; y: number; width: number; height: number }

const RECTS: Partial<Record<GlyphName, RectShape>> = {
  card: { x: 3, y: 5, width: 18, height: 14 },
  banknote: { x: 2, y: 6, width: 20, height: 12 },
}

const CIRCLES: Partial<Record<GlyphName, { cx: number; cy: number; r: number }>> = {
  clock: { cx: 12, cy: 12, r: 9 },
  sun: { cx: 12, cy: 12, r: 4.2 },
  search: { cx: 11, cy: 11, r: 6.5 },
  tag: { cx: 7.5, cy: 7.5, r: 1.3 },
  users: { cx: 9, cy: 8, r: 3.2 },
  userPlus: { cx: 9, cy: 8, r: 3.2 },
  user: { cx: 10, cy: 8, r: 3.4 },
  banknote: { cx: 12, cy: 12, r: 2.6 },
}

/** Контурная иконка интерфейса, рисунок по мотивам lucide. */
export function Glyph({
  name,
  size = 22,
  color = colors.ink,
  strokeWidth = 1.7,
}: {
  name: GlyphName
  size?: number
  color?: string
  strokeWidth?: number
}) {
  const rect = RECTS[name]
  const circle = CIRCLES[name]
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {rect ? <Rect {...rect} rx={2.5} stroke={color} strokeWidth={strokeWidth} /> : null}
      {circle ? <Circle {...circle} stroke={color} strokeWidth={strokeWidth} /> : null}
      {PATHS[name].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  )
}
