import { Printer, Receipt, Undo2 } from 'lucide-react'
import { Button, Modal } from '@/shared/ui'
import { money } from '@/shared/lib/format'
import type { PosShift } from '@/shared/api'
import { printReceipt } from '@/pages/pos/lib/print'
import type { Overlay } from '@/pages/pos/ui/overlay'

export function ReceiptDoneModal({
  result,
  shift,
  userName,
  onClose,
}: {
  result: Extract<Overlay, { kind: 'done' }>
  shift: PosShift
  userName: string
  onClose: () => void
}) {
  return (
    <Modal align="center" onClose={onClose}>
      <div className="flex flex-col items-center py-4 text-center">
        {result.isReturn ? (
          <Undo2 className="h-10 w-10" strokeWidth={1.25} />
        ) : (
          <Receipt className="h-10 w-10" strokeWidth={1.25} />
        )}
        <h2 className="mt-3 font-display text-2xl tracking-tight">
          {result.isReturn ? 'Возврат' : 'Чек'} №{result.doc.number} проведён
        </h2>
        {result.changeMinor > 0 && (
          <p className="mt-2 text-lg">
            Сдача: <span className="font-semibold">{money(result.changeMinor)}</span>
          </p>
        )}
        <div className="mt-6 flex w-full gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={() =>
              printReceipt(result.doc, shift, userName, result.changeMinor, result.receiptDiscountMinor)
            }
          >
            <Printer className="mr-2 h-4 w-4" />
            Печать
          </Button>
          <Button className="h-11 flex-1" onClick={onClose} autoFocus>
            Новый чек
          </Button>
        </div>
      </div>
    </Modal>
  )
}
