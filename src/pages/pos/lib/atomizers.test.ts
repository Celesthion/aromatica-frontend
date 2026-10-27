import { describe, expect, it } from 'vitest'
import type { PosProduct } from '@/shared/api'
import { atomizerVolumes, atomizersForVolume, sellableAtomizers } from './atomizers'
import { makeProduct } from './testing/fixtures'

const atomizer = (id: string, volumeMl: number | null, qty = 10): PosProduct =>
  makeProduct({ id, name: id, priceMinor: 350_00, kind: 'ATOMIZER', qty, volumeMl })

describe('sellableAtomizers', () => {
  it('отсекает флаконы без объёма и с занятым остатком', () => {
    const list = [atomizer('ok', 5), atomizer('noVol', null), atomizer('taken', 10, 1)]
    const out = sellableAtomizers(list, (a) => (a.id === 'taken' ? 0 : a.qty))
    expect(out.map((a) => a.id)).toEqual(['ok'])
  })
})

describe('atomizerVolumes', () => {
  it('уникальные объёмы по возрастанию: пресеты распива', () => {
    const list = [atomizer('a10', 10), atomizer('a5', 5), atomizer('b5', 5)]
    expect(atomizerVolumes(list)).toEqual([5, 10])
  })
})

describe('atomizersForVolume', () => {
  it('оставляет только точное совпадение объёма', () => {
    const list = [atomizer('a2', 2), atomizer('a5', 5), atomizer('b5', 5), atomizer('a10', 10)]
    expect(atomizersForVolume(list, 5).map((a) => a.id)).toEqual(['a5', 'b5'])
  })

  it('нет точного совпадения: пусто, остаётся вариант без атомайзера', () => {
    expect(atomizersForVolume([atomizer('a2', 2), atomizer('a10', 10)], 5)).toEqual([])
  })
})
