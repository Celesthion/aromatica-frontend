import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { PosCustomer } from '@/shared/api'
import { Glyph } from '~/components/Glyph'
import { light as colors, space } from '~/theme'

export function CheckoutHeader({
  done,
  customer,
  canClear,
  onCustomer,
  onUnlinkCustomer,
  onClear,
  onClose,
}: {
  done: boolean
  customer: PosCustomer | null
  canClear: boolean
  onCustomer: () => void
  onUnlinkCustomer: () => void
  onClear: () => void
  onClose: () => void
}) {
  return (
    <View style={styles.head}>
      {/* слева покупатель: без него кнопка добавления, с ним имя, телефон и крестик */}
      {done ? (
        <View style={styles.iconBtn} />
      ) : customer ? (
        <View style={styles.customerRow}>
          <Glyph name="user" size={17} color="rgba(244,245,247,0.6)" />
          <Pressable onPress={onCustomer} style={{ flexShrink: 1 }}>
            <Text style={styles.customerText} numberOfLines={1}>
              {customer.name}
              <Text style={styles.customerPhone}> · {customer.phone}</Text>
            </Text>
          </Pressable>
          <Pressable onPress={onUnlinkCustomer} hitSlop={10}>
            <Glyph name="close" size={14} color="rgba(244,245,247,0.45)" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onCustomer}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Glyph name="userPlus" size={21} color="rgba(244,245,247,0.6)" />
        </Pressable>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
        {canClear ? (
          <Pressable onPress={onClear} hitSlop={10} style={styles.iconBtn}>
            <Glyph name="trash" size={19} color="rgba(244,245,247,0.65)" />
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
          <Glyph name="close" size={20} color={colors.cream} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(4),
    paddingBottom: space(3),
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1.5),
    maxWidth: '70%',
  },
  customerText: { color: 'rgba(244,245,247,0.85)', fontSize: 13 },
  customerPhone: { color: 'rgba(244,245,247,0.45)' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
})
