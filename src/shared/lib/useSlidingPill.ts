import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Отрезок подложки вдоль оси: начало и длина. */
interface Span {
  start: number
  size: number
}

/** Шаг интегрирования пружин, с. */
const STEP_H = 1 / 60

/**
 * По пружине на каждый край подложки: ведущий срывается жёстко, ведомый отстаёт, и подложка
 * вытягивается между табами. Ведомый мягкий, пока до цели далеко, и жёсткий на подходе,
 * чтобы хвост не догонял долго.
 */
function useStretchSpan(target: Span | null): Span | null {
  const [span, setSpan] = useState<Span | null>(null)
  const st = useRef({ a: 0, b: 0, av: 0, bv: 0, ready: false, raf: 0 })

  useLayoutEffect(() => {
    if (!target) return
    const s = st.current
    const toA = target.start
    const toB = target.start + target.size
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    // первая установка и режим пониженной анимации: ставим сразу, без полёта
    if (!s.ready || reduce) {
      s.a = toA
      s.b = toB
      s.av = 0
      s.bv = 0
      s.ready = true
      setSpan({ start: toA, size: toB - toA })
      return
    }

    const forward = toA > s.a // ведущий край ближе к цели по ходу
    const trip = Math.max(1, forward ? Math.abs(toB - s.b) : Math.abs(toA - s.a))
    const step = (x: number, v: number, to: number, k: number, c: number) => {
      const nv = v + (-k * (x - to) - c * v) * STEP_H
      return [x + nv * STEP_H, nv] as const
    }

    let last = performance.now()
    const tick = (now: number) => {
      // фиксированный шаг сглаживает рывки при просадках кадров
      const frames = Math.min(4, Math.max(1, Math.round((now - last) / 16.7)))
      last = now
      for (let n = 0; n < frames; n++) {
        const dHead = forward ? Math.abs(s.b - toB) : Math.abs(s.a - toA)
        const home = 1 - Math.min(1, dHead / trip) // 0 далеко, 1 ведущий край на месте
        const kT = 62 + 155 * home
        const cT = 12 + 14 * home
        if (forward) {
          ;[s.b, s.bv] = step(s.b, s.bv, toB, 235, 22)
          ;[s.a, s.av] = step(s.a, s.av, toA, kT, cT)
        } else {
          ;[s.a, s.av] = step(s.a, s.av, toA, 235, 22)
          ;[s.b, s.bv] = step(s.b, s.bv, toB, kT, cT)
        }
      }
      const settled =
        Math.abs(s.a - toA) < 0.3 && Math.abs(s.b - toB) < 0.3 && Math.abs(s.av) < 3 && Math.abs(s.bv) < 3
      if (settled) {
        s.a = toA
        s.b = toB
        s.av = 0
        s.bv = 0
        setSpan({ start: toA, size: toB - toA })
        return
      }
      setSpan({ start: s.a, size: s.b - s.a })
      s.raf = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(s.raf)
    s.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(s.raf)
    // зависим от значений: объект target пересоздаётся на каждом измерении
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.start, target?.size])

  return span
}

/** Геометрия подложки в координатах контейнера, сразу для style пилюли. */
interface PillRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Ползущая подложка активного пункта меню с той же пружиной, что в верхнем меню модулей.
 * Контейнеру нужен `relative`, пунктам `relative z-10` и `ref={setItemRef(key)}`; подложку
 * рисует вызывающий отдельным `absolute`-спаном по возвращённому rect.
 *
 * axis: вдоль какой оси ехать; 'auto' берёт flex-direction контейнера (на мобильном лента
 * бывает горизонтальной, на десктопе колонкой). Поперёк оси подложка встаёт сразу, чтобы
 * при переносе пунктов на другую строку не было диагонального пролёта.
 */
export function useSlidingPill<E extends HTMLElement = HTMLElement>(
  activeKey: string | null | undefined,
  { axis = 'x', deps }: { axis?: 'x' | 'y' | 'auto'; deps?: unknown } = {},
): {
  navRef: React.RefObject<E>
  setItemRef: (key: string) => (el: HTMLElement | null) => void
  rect: PillRect | null
} {
  const navRef = useRef<E | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const [target, setTarget] = useState<Span | null>(null)
  const [cross, setCross] = useState<{ offset: number; thickness: number; vertical: boolean } | null>(null)
  const span = useStretchSpan(target)

  const setItemRef = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) itemRefs.current.set(key, el)
      else itemRefs.current.delete(key)
    },
    [],
  )

  useLayoutEffect(() => {
    const measure = () => {
      const nav = navRef.current
      const el = activeKey != null ? itemRefs.current.get(activeKey) : null
      if (!nav || !el) {
        setCross(null)
        return
      }
      // пункт может лежать внутри обёртки (подсказка, ячейка), и offsetTop врёт: меряем во
      // вьюпорте и переводим в систему контейнера, прибавляя скролл (ленты чипов прокручиваются)
      const a = el.getBoundingClientRect()
      const b = nav.getBoundingClientRect()
      const left = a.left - b.left + nav.scrollLeft
      const top = a.top - b.top + nav.scrollTop
      const vertical =
        axis === 'auto' ? getComputedStyle(nav).flexDirection.startsWith('column') : axis === 'y'
      setTarget(vertical ? { start: top, size: a.height } : { start: left, size: a.width })
      setCross(
        vertical
          ? { offset: left, thickness: a.width, vertical }
          : { offset: top, thickness: a.height, vertical },
      )
    }
    measure()
    // ширина пунктов зависит от шрифта, счётчиков и размера окна
    const ro = new ResizeObserver(measure)
    if (navRef.current) ro.observe(navRef.current)
    for (const el of itemRefs.current.values()) ro.observe(el)
    return () => ro.disconnect()
  }, [activeKey, axis, deps])

  const rect =
    span && cross
      ? cross.vertical
        ? { left: cross.offset, top: span.start, width: cross.thickness, height: span.size }
        : { left: span.start, top: cross.offset, width: span.size, height: cross.thickness }
      : null

  return { navRef: navRef as React.RefObject<E>, setItemRef, rect }
}
