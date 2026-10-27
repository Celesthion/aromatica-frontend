import type { ReactElement } from 'react'
import Svg, { Circle, G, Path, Rect } from 'react-native-svg'

const BASE = '#141519'
const SHAPE = '#212329'
const COLS = 6
const ROWS = 4
// фигура для каждой клетки сетки 6 на 4, раскладка фиксирована, чтобы узор не менялся при перерисовке
const LAYOUT = [2, 0, 3, 1, 0, 2, 1, 3, 0, 2, 3, 0, 0, 2, 1, 3, 1, 2, 3, 1, 2, 0, 2, 3]

/** Геометрический узор тёмной шапки: фигуры чуть светлее фона, чтобы не спорить с логотипом. */
export function BrandPattern({ width, height }: { width: number; height: number }) {
  const cell = Math.ceil(Math.max(width / COLS, height / ROWS))

  const tiles: ReactElement[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * cell
      const y = r * cell
      const kind = LAYOUT[r * COLS + c]
      const key = `${r}-${c}`
      if (kind === 0) {
        tiles.push(<Circle key={key} cx={x + cell / 2} cy={y + cell / 2} r={cell * 0.38} fill={SHAPE} />)
      } else if (kind === 1) {
        // четверть круга, повёрнутая по позиции в сетке
        const turn = (r + c) % 4
        const d =
          turn === 0
            ? `M${x} ${y} h${cell} a${cell} ${cell} 0 0 1 -${cell} ${cell} z`
            : turn === 1
              ? `M${x + cell} ${y} v${cell} a${cell} ${cell} 0 0 1 -${cell} -${cell} z`
              : turn === 2
                ? `M${x + cell} ${y + cell} h-${cell} a${cell} ${cell} 0 0 1 ${cell} -${cell} z`
                : `M${x} ${y + cell} v-${cell} a${cell} ${cell} 0 0 1 ${cell} ${cell} z`
        tiles.push(<Path key={key} d={d} fill={SHAPE} />)
      } else if (kind === 2) {
        const d =
          (r + c) % 2 === 0
            ? `M${x} ${y + cell} L${x + cell / 2} ${y} L${x + cell} ${y + cell} z`
            : `M${x} ${y} L${x + cell} ${y} L${x + cell / 2} ${y + cell} z`
        tiles.push(<Path key={key} d={d} fill={SHAPE} />)
      } else {
        tiles.push(
          <Circle
            key={key}
            cx={x + cell / 2}
            cy={y + cell / 2}
            r={cell * 0.3}
            stroke={SHAPE}
            strokeWidth={cell * 0.12}
            fill="none"
          />,
        )
      }
    }
  }

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Rect x={0} y={0} width={width} height={height} fill={BASE} />
      <G opacity={0.9}>{tiles}</G>
    </Svg>
  )
}
