import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { printDocument, receiptPrintout, shiftReportPrintout } from '@/pages/pos/lib/print'
import type { DocDto, PosShift, PosShiftSummary } from '@/shared/api'

// разметка та же, что в вебе; системный диалог печати умеет и PDF, и AirPrint/Mopria
async function output(title: string, body: string, share: boolean): Promise<void> {
  const html = printDocument(title, body)
  if (!share) {
    await Print.printAsync({ html })
    return
  }
  const { uri } = await Print.printToFileAsync({ html })
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' })
}

export function printReceipt(
  doc: DocDto,
  shift: PosShift,
  seller: string,
  changeMinor: number,
  receiptDiscountMinor = 0,
  share = false,
): Promise<void> {
  const { title, body } = receiptPrintout(doc, shift, seller, changeMinor, receiptDiscountMinor)
  return output(title, body, share)
}

export function printShiftReport(
  shift: PosShift,
  summary: PosShiftSummary,
  title: string,
  share = false,
): Promise<void> {
  const doc = shiftReportPrintout(shift, summary, title)
  return output(doc.title, doc.body, share)
}
