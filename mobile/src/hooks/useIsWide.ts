import { useWindowDimensions } from 'react-native'

/** Планшет: короткая сторона от 600 dp, как sw600dp в Android. */
export function useIsWide(): boolean {
  const { width, height } = useWindowDimensions()
  return Math.min(width, height) >= 600
}
