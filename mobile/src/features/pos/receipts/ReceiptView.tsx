import { Text, View } from 'react-native'
import type { DocDto, PosShift } from '@/shared/api'
import { dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'
import { Button } from '~/components/Button'
import { Sheet } from '~/components/Sheet'
import { useStyles } from '~/hooks/useTheme'
import { space } from '~/theme'
import { printReceipt } from '../print'
import { makeReceiptsStyles } from './receiptsStyles'

export function ReceiptView({
  receipt,
  shift,
  seller,
  onBack,
}: {
  receipt: DocDto
  shift: PosShift
  seller: string
  onBack: () => void
}) {
  const styles = useStyles(makeReceiptsStyles)
  const isReturn = receipt.docType === 'RETURN'
  const payments = (
    [
      ['Наличными', receipt.cashMinor],
      ['Переводом', receipt.noCashMinor],
    ] as const
  ).filter(([, v]) => v > 0)

  return (
    <Sheet visible title={`${isReturn ? 'Возврат' : 'Чек'} №${receipt.number}`} onClose={onBack}>
      <Text style={styles.hint}>
        {dateTimeFmt(receipt.moment)}
        {receipt.createdBy ? ` · продавец: ${receipt.createdBy}` : ''}
      </Text>

      {receipt.lines.map((l) => (
        <View key={l.id} style={styles.viewLine}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {l.productName}
            </Text>
            <Text style={styles.hint}>
              {qtyFmt(l.qty)} × {money(l.priceMinor)}
              {l.discountMinor > 0 ? ` · скидка ${money(l.discountMinor)}` : ''}
              {l.gift ? ' · подарок' : ''}
            </Text>
          </View>
          <Text style={styles.rowSum}>{money(l.sumMinor)}</Text>
        </View>
      ))}

      <View style={styles.totals}>
        <View style={styles.rowHead}>
          <Text style={styles.hint}>Итого</Text>
          <Text style={styles.total}>{money(receipt.sumMinor)}</Text>
        </View>
        {payments.map(([label, v]) => (
          <View key={label} style={styles.rowHead}>
            <Text style={styles.hint}>{isReturn ? `Возвращено: ${label.toLowerCase()}` : label}</Text>
            <Text style={styles.rowSum}>{money(v)}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: space(2) }}>
        <Button variant="ghost" title="Назад" onPress={onBack} />
        <Button
          title="Печать чека"
          onPress={() => void printReceipt(receipt, shift, receipt.createdBy ?? seller, 0)}
          style={{ flex: 1 }}
        />
      </View>
    </Sheet>
  )
}
