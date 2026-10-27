import { Pressable, StyleSheet, Text, View } from 'react-native'
import { light as colors, radius, space } from '~/theme'

export function ConfirmClear({
  count,
  onCancel,
  onConfirm,
}: {
  count: number
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <View style={styles.confirmWrap}>
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>Удалить чек?</Text>
        <Text style={styles.confirmHint}>
          Из чека пропадут все {count} позиций. Если клиент вернётся — лучше отложить чек.
        </Text>
        <View style={{ flexDirection: 'row', gap: space(2), marginTop: space(2) }}>
          <Pressable onPress={onCancel} style={[styles.confirmBtn, { backgroundColor: colors.cardAlt }]}>
            <Text style={[styles.confirmBtnText, { color: colors.ink }]}>Оставить</Text>
          </Pressable>
          <Pressable onPress={onConfirm} style={[styles.confirmBtn, { backgroundColor: colors.danger }]}>
            <Text style={[styles.confirmBtnText, { color: colors.white }]}>Удалить</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  confirmWrap: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(20,21,25,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space(6),
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space(5),
    gap: space(2),
  },
  confirmTitle: { fontSize: 19, fontWeight: '700', color: colors.ink },
  confirmHint: { fontSize: 14, color: colors.muted, lineHeight: 19 },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '600' },
})
