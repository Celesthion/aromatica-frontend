import type { PosProduct } from '@/shared/api'

/** Атомайзеры с объёмом и свободным остатком; без объёма не предлагаем, непонятно, влезет ли налив. */
export function sellableAtomizers(
  atomizers: PosProduct[],
  remaining: (a: PosProduct) => number,
): PosProduct[] {
  return atomizers.filter((a) => a.volumeMl != null && a.volumeMl > 0 && remaining(a) > 0)
}

/** Объёмы имеющихся атомайзеров служат пресетами распива. */
export function atomizerVolumes(atomizers: PosProduct[]): number[] {
  return [...new Set(atomizers.map((a) => a.volumeMl!))].sort((x, y) => x - y)
}

export function atomizersForVolume(atomizers: PosProduct[], ml: number): PosProduct[] {
  return atomizers.filter((a) => a.volumeMl === ml)
}
