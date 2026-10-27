import { StyleSheet } from 'react-native'
import type { Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'

/** Стили шторки чеков смены, общие для списка, просмотра и возврата. */
export const makeReceiptsStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(3.5),
      gap: space(1),
    },
    rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowTitle: { fontSize: 14, fontWeight: '600', color: t.ink },
    rowSum: { fontSize: 14, fontWeight: '700', color: t.ink },
    hint: { fontSize: 12, color: t.muted },
    actions: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginTop: space(2) },
    action: {
      paddingHorizontal: space(3.5),
      paddingVertical: space(2),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.border,
    },
    actionText: { fontSize: 12.5, fontWeight: '600', color: t.ink },
    void: { fontSize: 12.5, color: t.danger, marginLeft: 'auto' },

    confirm: {
      marginTop: space(3),
      backgroundColor: 'rgba(192,96,79,0.08)',
      borderRadius: radius.md,
      padding: space(3),
    },
    confirmText: { fontSize: 13, color: t.ink, lineHeight: 18 },
    confirmGhost: {
      flex: 1,
      height: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmGhostText: { fontSize: 14, fontWeight: '600', color: t.ink },
    confirmDanger: {
      flex: 1,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: t.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmDangerText: { fontSize: 14, fontWeight: '600', color: t.white },

    viewLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      paddingVertical: space(2.5),
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    totals: {
      backgroundColor: t.cardAlt,
      borderRadius: radius.lg,
      padding: space(3.5),
      gap: space(1.5),
    },
    total: { fontSize: 20, fontWeight: '700', color: t.ink },

    returnLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(3),
    },

    method: {
      flex: 1,
      flexDirection: 'row',
      gap: space(2),
      height: 52,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.field,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodOn: { backgroundColor: t.primary, borderColor: t.primary },
    methodText: { fontSize: 14.5, fontWeight: '600', color: t.ink },

    error: { color: t.danger, fontSize: 13 },
  })
