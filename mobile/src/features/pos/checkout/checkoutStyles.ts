import { StyleSheet } from 'react-native'
import { light as colors, radius, space } from '~/theme'

/** Стили, общие для частей окна чека. */
export const checkoutStyles = StyleSheet.create({
  rowLabel: { fontSize: 13, color: 'rgba(244,245,247,0.55)' },
  payCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    padding: space(4),
  },
  primary: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '600', color: colors.ink },
})
