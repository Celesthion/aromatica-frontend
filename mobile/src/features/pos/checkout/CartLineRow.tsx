import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
// expo-image: Image из react-native теряет прозрачность AVIF на Android
import { Image } from 'expo-image'
import { pricePerSprayMl, sprayForOil } from '@/entities/product/dilution'
import type { CartLine } from '@/pages/pos/lib/types'
import { imageUrl } from '@/shared/api'
import { money, qtyFmt } from '@/shared/lib/format'
import { discountPctFor, lineSumMinor, parseDecimal } from '@/shared/lib/money'
import { Glyph } from '~/components/Glyph'
import { light as colors, radius, space } from '~/theme'
import { useCart } from '../cart'
import { checkoutStyles } from './checkoutStyles'
import { QtyStepper } from './QtyStepper'

/** Строка чека; по нажатию под ней открывается панель скидки. */
export function CartLineRow({
  line: l,
  open,
  onToggle,
  onToShelf,
  shelfPending,
}: {
  line: CartLine
  open: boolean
  onToggle: () => void
  onToShelf: (bundleId: string) => void
  shelfPending: boolean
}) {
  const setQty = useCart((s) => s.setQty)
  const setDiscount = useCart((s) => s.setDiscount)
  const remove = useCart((s) => s.remove)
  const removeGiftGroup = useCart((s) => s.removeGiftGroup)

  return (
    <View>
      <Pressable onPress={onToggle} style={styles.line}>
        <View style={styles.thumb}>
          {l.product.mainImageId ? (
            <Image
              source={{ uri: imageUrl(l.product.mainImageId) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <Glyph name="tag" size={18} color="rgba(244,245,247,0.5)" />
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.lineName} numberOfLines={2}>
            {l.product.name}
          </Text>
          <Text style={styles.lineFormula}>
            {l.isGift
              ? `Подарок · ${qtyFmt(l.qty)} ${l.product.unit === 'ML' ? 'мл' : 'шт'}`
              : l.dilutionPct != null
                ? // в строке разлива масло, а клиент уносит флакон, его и показываем
                  `${qtyFmt(sprayForOil(l.qty, l.dilutionPct))} мл · ${qtyFmt(l.dilutionPct)} % × ${money(pricePerSprayMl(l.priceMinor, l.dilutionPct))}`
                : `${qtyFmt(l.qty)} ${l.product.unit === 'ML' ? 'мл' : 'шт'} × ${money(l.priceMinor)}${
                    l.discountMinor > 0 ? ` · −${money(l.discountMinor)}` : ''
                  }${l.warehouseId != null ? ' · с полки' : ''}`}
          </Text>
          {/* налитое не правится: флакон уже наполнен */}
          {l.isGift || l.product.unit === 'ML' ? null : (
            <QtyStepper
              value={qtyFmt(l.qty)}
              onDec={() => setQty(l.lineId, l.qty - 1)}
              onInc={() => setQty(l.lineId, l.qty + 1)}
            />
          )}
        </View>

        <View style={{ alignItems: 'flex-end', gap: space(3) }}>
          <Text style={styles.lineSum}>
            {l.isGift ? '0 с' : money(lineSumMinor(l.qty, l.priceMinor, l.discountMinor))}
          </Text>
          {l.isGift ? (
            <Pressable onPress={() => removeGiftGroup(l.giftGroupId!)} hitSlop={10}>
              <Glyph name="close" size={16} color="rgba(244,245,247,0.45)" />
            </Pressable>
          ) : (
            <Glyph name="chevronRight" size={16} color="rgba(244,245,247,0.35)" />
          )}
        </View>
      </Pressable>

      {/* цену на кассе не правят: уступка клиенту делается скидкой */}
      {open && !l.isGift ? (
        <View style={styles.linePanel}>
          <Text style={styles.linePanelName} numberOfLines={2}>
            {l.product.name}
          </Text>
          <View style={styles.linePanelRow}>
            <Text style={checkoutStyles.rowLabel}>Скидка</Text>
            <TextInput
              value={l.discountMinor ? String(discountPctFor(l.qty, l.priceMinor, l.discountMinor)) : ''}
              onChangeText={(v) => setDiscount(l.lineId, parseDecimal(v) || 0)}
              placeholder="0"
              placeholderTextColor="rgba(244,245,247,0.3)"
              keyboardType="decimal-pad"
              style={[styles.smallInput, { width: 54 }]}
            />
            <Text style={checkoutStyles.rowLabel}>%</Text>
            {l.bundleId != null ? (
              <Pressable
                onPress={() => onToShelf(l.bundleId!)}
                disabled={shelfPending}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <Glyph name="box" size={16} color={colors.cream} />
                <Text style={[styles.removeText, { color: colors.cream }]}>На полку</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => (l.giftGroupId ? removeGiftGroup(l.giftGroupId) : remove(l.lineId))}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <Glyph name="trash" size={16} color={colors.danger} />
              <Text style={styles.removeText}>Убрать</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    gap: space(3),
    paddingVertical: space(3),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lineName: { fontSize: 14, fontWeight: '600', color: colors.cream, lineHeight: 19 },
  lineFormula: { fontSize: 12, color: 'rgba(244,245,247,0.45)', marginTop: 2 },
  lineSum: { fontSize: 14, fontWeight: '600', color: colors.cream },
  linePanel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    padding: space(3),
    marginBottom: space(2),
    gap: space(2),
  },
  linePanelName: { color: 'rgba(244,245,247,0.7)', fontSize: 12.5 },
  linePanelRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  smallInput: {
    minWidth: 74,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
    color: colors.cream,
    textAlign: 'center',
    fontSize: 14,
  },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), marginLeft: 'auto' },
  removeText: { color: colors.danger, fontSize: 13 },
})
