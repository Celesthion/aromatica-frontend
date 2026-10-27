import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'

/** Стеклянная панель: размытие, подложка, блик сверху, тень снизу. */
export function Glass({
  children,
  style,
  radius = 32,
}: {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  radius?: number
}) {
  return (
    <View style={[styles.wrap, { borderRadius: radius }, styles.edge, style]}>
      <BlurView
        intensity={85}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />

      {/* подложка почти чёрная: прозрачная на светлой витрине даёт серое пятно */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16,17,22,0.72)' }]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
        style={[styles.glow, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.6)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rimLine}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
        style={[styles.rimBottom, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}
        pointerEvents="none"
      />

      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderWidth: 1 },
  edge: {
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#0d0e13',
    shadowOpacity: 0.32,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  glow: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
  rimLine: { position: 'absolute', left: 12, right: 12, top: 0, height: 1.5 },
  rimBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
})
