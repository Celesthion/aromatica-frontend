import { useQuery } from '@tanstack/react-query'
import {
  fetchCurrentShift,
  fetchPosAtomizers,
  fetchPosDrafts,
  fetchReservations,
  fetchShiftSummary,
  queryKeys,
  type Reservation,
} from '@/shared/api'

/** Текущая открытая смена или null; enabled выключает запрос в скрытой шторке. */
export function useShift(enabled = true) {
  return useQuery({ queryKey: queryKeys.pos.currentShift, queryFn: fetchCurrentShift, enabled })
}

/** X-отчёт смены; без смены не грузится. */
export function useShiftReport(shiftId?: string) {
  return useQuery({
    queryKey: queryKeys.pos.summary.byShift(shiftId),
    queryFn: () => fetchShiftSummary(shiftId!),
    enabled: !!shiftId,
  })
}

export function useDrafts(shiftId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.pos.drafts.byShift(shiftId),
    queryFn: () => fetchPosDrafts(shiftId!),
    enabled: enabled && !!shiftId,
  })
}

export function useReservations(warehouseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.pos.reservations.byWarehouse(warehouseId),
    queryFn: () => fetchReservations(warehouseId),
    enabled,
  })
}

export function useAtomizers(warehouseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.pos.atomizers.byWarehouse(warehouseId),
    queryFn: () => fetchPosAtomizers(warehouseId),
    enabled,
  })
}

/** Бронь, которую ещё можно продать, продлить или отменить. */
export function isOpenReservation(r: Reservation): boolean {
  return r.status === 'ACTIVE' || r.status === 'EXPIRED'
}
