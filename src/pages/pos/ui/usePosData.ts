import { useQuery } from '@tanstack/react-query'
import {
  fetchPosAtomizers,
  fetchPosDrafts,
  fetchPosGiftRules,
  fetchPosPackaging,
  fetchPosSettings,
  fetchReservations,
  type PosShift,
  queryKeys,
} from '@/shared/api'

/** Данные смены, которые нужны чеку и окнам кассы. */
export function usePosData(shift: PosShift) {
  // упаковки в поиске товаров нет, её предлагают при оплате
  const packaging = useQuery({
    queryKey: queryKeys.pos.packaging.byWarehouse(shift.warehouseId),
    queryFn: () => fetchPosPackaging(shift.warehouseId),
  })
  // отложенные чеки и брони здесь только для счётчиков, списки грузят окна
  const drafts = useQuery({
    queryKey: queryKeys.pos.drafts.byShift(shift.id),
    queryFn: () => fetchPosDrafts(shift.id),
  })
  const reservations = useQuery({
    queryKey: queryKeys.pos.reservations.byWarehouse(shift.warehouseId),
    queryFn: () => fetchReservations(shift.warehouseId),
  })
  const settings = useQuery({
    queryKey: queryKeys.pos.settings,
    queryFn: fetchPosSettings,
    staleTime: 5 * 60_000,
  })
  const giftRules = useQuery({
    queryKey: queryKeys.pos.giftRules.byWarehouse(shift.warehouseId),
    queryFn: () => fetchPosGiftRules(shift.warehouseId),
  })
  // объёмы атомайзеров задают варианты налива
  const atomizers = useQuery({
    queryKey: queryKeys.pos.atomizers.byWarehouse(shift.warehouseId),
    queryFn: () => fetchPosAtomizers(shift.warehouseId),
  })

  return {
    packaging: packaging.data ?? [],
    draftCount: drafts.data?.length ?? 0,
    activeReservations: (reservations.data ?? []).filter((r) => !r.expired).length,
    settings: settings.data ?? null,
    giftRules: giftRules.data ?? [],
    atomizers: atomizers.data ?? [],
  }
}

export type PosData = ReturnType<typeof usePosData>
