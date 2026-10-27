import { useState } from 'react'
import type { PosProduct } from '@/shared/api'
import { parseDecimal } from '@/shared/lib/money'
import {
  isDilutable,
  isDilutionValid,
  oilForSpray,
  pricePerSprayMl,
  sprayForOil,
} from '@/entities/product/dilution'
import { atomizerVolumes, atomizersForVolume, sellableAtomizers } from '@/pages/pos/lib/atomizers'
import { isPouredValid, pourShortfall } from '@/pages/pos/lib/pour'
import type { ProductGroup } from '@/pages/pos/lib/types'

/** Состояние окна налива: объём, доля масла, атомайзер и экран нехватки. */
export function usePourForm({
  product,
  available,
  atomizers,
  inCartQty,
  initialMl,
  defaultDilutionPct,
  onShortfall,
}: {
  product: PosProduct
  available: number
  atomizers: PosProduct[]
  inCartQty: (id: string) => number
  initialMl?: number
  defaultDilutionPct: number
  onShortfall: (pouredMl: number, writeOffMl: number, shortfallMl: number) => Promise<void>
}) {
  const [stage, setStage] = useState<'ml' | 'atomizer'>('ml')
  // пресет и свой объём взаимоисключающие
  const [presetMl, setPresetMl] = useState<number | null>(null)
  const [customMl, setCustomMl] = useState(initialMl != null ? String(initialMl) : '')
  // null: клиент со своей тарой
  const [atomizerId, setAtomizerId] = useState<string | null>(null)
  // раскрытая карточка атомайзера с цветами
  const [atomizerGroup, setAtomizerGroup] = useState<ProductGroup | null>(null)
  // доля масла нужна только разливу
  const dilutable = isDilutable(product.kind)
  // pctText: что в поле, pctValue: последнее валидное значение (цены не прыгают при наборе)
  const [pctText, setPctText] = useState(String(defaultDilutionPct))
  const [pctValue, setPctValue] = useState(defaultDilutionPct)
  const pct = dilutable ? pctValue : 100
  const pctTyped = pctText.trim() !== ''
  const pctBroken = pctTyped && !isDilutionValid(parseDecimal(pctText))
  const typePct = (v: string) => {
    setPctText(v)
    const n = parseDecimal(v)
    if (isDilutionValid(n)) setPctValue(n)
  }
  // ушли из поля с пустым или неверным значением: возвращаем принятое
  const commitPct = () => {
    if (pctBroken || !pctTyped) setPctText(String(pctValue))
  }
  // экран нехватки поверх шага, чтобы назад вернуло туда же
  const [shortfallOpen, setShortfallOpen] = useState(false)
  const [pouredMl, setPouredMl] = useState('')
  const [writeOffError, setWriteOffError] = useState<unknown>(null)
  const [writingOff, setWritingOff] = useState(false)

  // у разлива цена за мл масла, у распива готового парфюма
  const perMl = product.priceMinor ?? 0
  const perSprayMl = dilutable ? pricePerSprayMl(perMl, pct) : perMl
  // остаток хранится в масле, а в окне объёмы флакона
  const sprayAvailable = dilutable ? sprayForOil(available, pct) : available
  const usingCustom = customMl.trim() !== ''
  const customN = parseDecimal(customMl)
  const customValid = usingCustom && Number.isFinite(customN) && customN > 0 && customN <= sprayAvailable
  const activeMl = usingCustom ? (customValid ? customN : null) : presetMl
  // в строку чека уходит масло
  const activeOilMl = activeMl == null ? null : dilutable ? oilForSpray(activeMl, pct) : activeMl

  // атомайзеры, которые ещё можно продать с учётом чека; их объёмы и есть пресеты
  const inStock = sellableAtomizers(atomizers, (a) => a.qty - inCartQty(a.id))
  const volumes = atomizerVolumes(inStock)
  const atomizersForMl = activeMl == null ? [] : atomizersForVolume(inStock, activeMl)
  const selectedAtomizer = inStock.find((a) => a.id === atomizerId) ?? null

  const defaultAtomizerFor = (ml: number | null) =>
    ml == null ? null : (inStock.find((a) => a.volumeMl === ml)?.id ?? null)
  const pickPreset = (ml: number) => {
    setPresetMl(ml)
    setCustomMl('')
    setAtomizerId(defaultAtomizerFor(ml))
    setAtomizerGroup(null)
    setStage('atomizer')
  }
  const typeCustom = (v: string) => {
    setCustomMl(v)
    setPresetMl(null)
    const n = parseDecimal(v)
    const validMl = Number.isFinite(n) && n > 0 && n <= available ? n : null
    setAtomizerId(defaultAtomizerFor(validMl))
  }

  // при нехватке кассир вводит только налитое, остальное считаем
  const pouredN = parseDecimal(pouredMl)
  const pouredOk = pouredMl.trim() !== '' && isPouredValid(pouredN, available)
  const short = pouredOk ? pourShortfall(activeOilMl, pouredN, available) : null
  const confirmShortfall = async () => {
    if (short == null || short.writeOffMl <= 0) return
    setWritingOff(true)
    setWriteOffError(null)
    try {
      await onShortfall(pouredN, short.writeOffMl, short.shortfallMl)
    } catch (e) {
      setWriteOffError(e)
      setWritingOff(false)
    }
  }
  const openShortfall = () => {
    setShortfallOpen(true)
    setWriteOffError(null)
  }

  return {
    stage,
    setStage,
    dilutable,
    pct,
    pctText,
    pctBroken,
    typePct,
    commitPct,
    perMl,
    perSprayMl,
    sprayAvailable,
    presetMl,
    pickPreset,
    customMl,
    customN,
    usingCustom,
    customValid,
    typeCustom,
    activeMl,
    activeOilMl,
    volumes,
    atomizersForMl,
    atomizerId,
    setAtomizerId,
    atomizerGroup,
    setAtomizerGroup,
    selectedAtomizer,
    shortfallOpen,
    openShortfall,
    closeShortfall: () => setShortfallOpen(false),
    pouredMl,
    setPouredMl,
    pouredOk,
    short,
    writeOffError,
    writingOff,
    confirmShortfall,
  }
}

export type PourForm = ReturnType<typeof usePourForm>
