import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
// expo-image: Image из react-native теряет прозрачность AVIF на Android
import { Image } from 'expo-image'
import type { LucideIcon } from 'lucide-react-native'
import { imageUrl } from '@/shared/api'
import type { ProductGroup } from '@/pages/pos/lib/types'
import { money, qtyFmt } from '@/shared/lib/format'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'

// подписи заезжают на нижний край фото, а фото оставляет под ними место
const INFO_OVERLAP = 34

/** Плитка витрины: фото, форма, бренд и модель, остаток и минимальная цена. */
export function ProductTile({
  group,
  kindLabel,
  KindIcon,
  kindColor,
  onPress,
}: {
  group: ProductGroup
  kindLabel?: string
  KindIcon: LucideIcon
  kindColor: string
  onPress: () => void
}) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const prices = group.variants.map((v) => v.priceMinor ?? 0).filter((p) => p > 0)
  const from = prices.length ? Math.min(...prices) : 0
  const perMl = group.unit === 'ML'

  // у единственного варианта показываем его объём или цвет, иначе число вариантов
  const only = group.variants.length === 1 ? group.variants[0] : null
  const corner = only
    ? only.label?.trim() || (only.volumeMl != null ? `${qtyFmt(only.volumeMl)} мл` : '')
    : `${group.variants.length} вар.`

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
    >
      <View style={styles.thumb}>
        {group.imageId ? (
          <Image
            source={{ uri: imageUrl(group.imageId) }}
            style={styles.photo}
            contentFit="contain"
            transition={120}
          />
        ) : (
          <KindIcon size={30} color={t.muted} strokeWidth={1.5} />
        )}
        {corner ? (
          <View style={styles.variantBadge}>
            <Text style={styles.variantBadgeText}>{corner}</Text>
          </View>
        ) : null}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {/* ушли в минус: показываем точное значение */}
            {group.totalQty <= 0 && group.minusQty > 0
              ? `−${qtyFmt(group.minusQty)}`
              : qtyFmt(group.totalQty)}
            {perMl ? ' мл' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        {/* без BlurView: на тридцати плитках он тормозит слабый планшет */}
        <View style={styles.infoTint} />
        <LinearGradient
          colors={t.sheen}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={[styles.kindMark, { backgroundColor: kindColor }]}>
          <KindIcon size={14} color={t.white} strokeWidth={2} />
        </View>
        {kindLabel ? (
          <Text style={[styles.tileKind, { color: kindColor }]} numberOfLines={1}>
            {kindLabel}
          </Text>
        ) : null}
        {group.brand ? (
          <Text numberOfLines={1} style={styles.tileBrand}>
            {group.brand}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={styles.tileModel}>
          {group.model}
        </Text>
        <Text style={styles.tilePrice}>{from ? `${money(from)}${perMl ? '/мл' : ''}` : '—'}</Text>
      </View>
    </Pressable>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      backgroundColor: t.tile,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: t.tileEdge,
      overflow: 'hidden',
      shadowColor: '#465064',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    thumb: {
      aspectRatio: 0.72,
      backgroundColor: t.thumb,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    photo: { ...StyleSheet.absoluteFillObject, margin: space(2.5), marginBottom: INFO_OVERLAP + 6 },
    info: {
      marginTop: -INFO_OVERLAP,
      paddingHorizontal: space(2.5),
      paddingTop: space(2),
      paddingBottom: space(2.5),
    },
    infoTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.caption },
    badge: {
      position: 'absolute',
      right: space(1.5),
      top: space(1.5),
      backgroundColor: t.badge,
      borderRadius: radius.pill,
      paddingHorizontal: space(1.75),
      paddingVertical: 2,
    },
    badgeText: { color: t.badgeInk, fontSize: 10, fontWeight: '700' },
    variantBadge: {
      position: 'absolute',
      left: space(1.5),
      top: space(1.5),
      backgroundColor: t.badge,
      borderRadius: radius.pill,
      paddingHorizontal: space(1.75),
      paddingVertical: 2,
    },
    variantBadgeText: { color: t.badgeInk, fontSize: 10, fontWeight: '700' },
    kindMark: {
      position: 'absolute',
      right: space(2),
      top: -14,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    tileKind: { fontSize: 10.5, fontWeight: '700' },
    tileBrand: { fontSize: 10, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
    tileModel: { fontSize: 13, color: t.ink, fontWeight: '600', lineHeight: 17 },
    tilePrice: { fontSize: 12.5, color: t.accent, fontWeight: '700', flexShrink: 1 },
  })
