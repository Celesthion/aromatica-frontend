import type { DocDto, PosProduct } from '@/shared/api'
import type { PendingBundle, ProductGroup } from '@/pages/pos/lib/types'

/** Окно поверх терминала; открыто не больше одного. */
export type Overlay =
  | { kind: 'none' }
  | { kind: 'paying' }
  | { kind: 'summary' }
  | { kind: 'receipts' }
  | { kind: 'closing' }
  | { kind: 'gifts' }
  | { kind: 'drafts' }
  | { kind: 'shelf' }
  // openForm: вернулись из выбора покупателя, сразу показываем форму брони
  | { kind: 'reservations'; openForm?: boolean }
  // бронь без покупателя не оформить, после выбора возвращаемся к ней
  | { kind: 'customers'; then?: 'reservations' }
  // search: начальный запрос; thenPour: вернуться к наливу после вскрытия флакона
  | {
      kind: 'convert'
      search?: string
      thenPour?: { product: PosProduct; qty: number; pendingMl: number }
    }
  | { kind: 'certSale' }
  // pendingMl: сколько осталось долить, когда прошлый флакон кончился
  | { kind: 'preset'; product: PosProduct; pendingMl?: number }
  | { kind: 'variant'; group: ProductGroup }
  | { kind: 'bundle'; bundle: PendingBundle }
  | { kind: 'done'; doc: DocDto; changeMinor: number; isReturn: boolean; receiptDiscountMinor: number }

export const NO_OVERLAY: Overlay = { kind: 'none' }
