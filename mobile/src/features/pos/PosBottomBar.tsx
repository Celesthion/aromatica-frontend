import { Fragment, type ReactNode } from 'react'
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Glass } from '~/components/Glass'
import { Glyph } from '~/components/Glyph'
import { useKeyboardHeight } from '~/hooks/useKeyboardHeight'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'

/** Нижняя панель кассы: меню, покупатель, чек, поиск. */
export function PosBottomBar({
  searchOpen,
  onOpenSearch,
  onCloseSearch,
  search,
  onChangeSearch,
  onMenu,
  lineCount,
  onReceipt,
  onCustomer,
  customerName,
  chips,
  wide,
  onHeight,
}: {
  searchOpen: boolean
  onOpenSearch: () => void
  onCloseSearch: () => void
  search: string
  onChangeSearch: (v: string) => void
  onMenu: () => void
  lineCount: number
  onReceipt: () => void
  onCustomer: () => void
  customerName: string | null
  chips: ReactNode
  wide: boolean
  /** Сообщает свою высоту: на неё отодвигается низ списка товаров. */
  onHeight: (h: number) => void
}) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()

  const bottom = keyboard > 0 ? keyboard + space(2) : insets.bottom + space(3)

  // поиск сверху: в edge-to-edge высота из keyboardDidShow неточна и строка уходит под клавиатуру
  if (searchOpen)
    return (
      <View style={[styles.barWrap, { top: insets.top + space(2), paddingHorizontal: space(4) }]}>
        <View style={styles.searchBar}>
          <Glyph name="search" size={18} color={t.muted} />
          <TextInput
            value={search}
            onChangeText={onChangeSearch}
            placeholder="Поиск товара"
            placeholderTextColor={t.muted}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Pressable
            onPress={() => {
              Keyboard.dismiss()
              onCloseSearch()
            }}
            hitSlop={10}
          >
            <Text style={styles.cancel}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    )

  const items = [
    { key: 'menu', glyph: 'menu' as const, label: 'Меню', onPress: onMenu, dot: false },
    {
      key: 'customer',
      glyph: 'users' as const,
      label: customerName ?? 'Покупатель',
      onPress: onCustomer,
      dot: !!customerName,
    },
    { key: 'receipt', glyph: 'receipt' as const, label: 'Чек', onPress: onReceipt, dot: lineCount > 0 },
    { key: 'search', glyph: 'search' as const, label: 'Поиск', onPress: onOpenSearch, dot: false },
  ]

  return (
    <View
      style={[styles.barWrap, { bottom }]}
      onLayout={(e) => onHeight(e.nativeEvent.layout.height + bottom)}
    >
      {chips ? <View style={{ marginBottom: space(3) }}>{chips}</View> : null}
      <Glass radius={34} style={[styles.pill, wide && styles.pillWide]}>
        {items.map((it, i) => (
          <Fragment key={it.key}>
            {i > 0 ? <View style={[styles.divider, wide && styles.dividerWide]} /> : null}
            <Pressable
              onPress={it.onPress}
              style={({ pressed }) => [
                styles.pillBtn,
                wide && styles.pillBtnWide,
                pressed && styles.pillBtnPressed,
              ]}
            >
              <View style={styles.pillIcon}>
                <Glyph name={it.glyph} size={wide ? 24 : 23} color={t.white} />
              </View>
              {wide ? (
                <Text style={styles.pillLabel} numberOfLines={1}>
                  {it.label}
                </Text>
              ) : null}
              {it.dot ? <View style={[styles.dot, wide && styles.dotWide]} /> : null}
            </Pressable>
          </Fragment>
        ))}
      </Glass>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    barWrap: { position: 'absolute', left: 0, right: 0 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      paddingHorizontal: space(2),
      paddingVertical: space(1.5),
    },
    pillBtn: { width: 62, height: 52, alignItems: 'center', justifyContent: 'center' },
    pillWide: {
      paddingHorizontal: space(4),
      paddingVertical: space(2.5),
      borderRadius: 34,
      gap: space(2),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    pillBtnWide: {
      width: 'auto',
      minWidth: 104,
      height: 56,
      paddingHorizontal: space(4),
      borderRadius: 28,
      gap: space(1),
    },
    divider: {
      width: 1,
      height: 26,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignSelf: 'center',
    },
    dividerWide: { height: 32 },
    pillBtnPressed: {
      transform: [{ scale: 0.94 }],
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: 26,
    },
    // тень держит иконку читаемой на светлой витрине под стеклом
    pillIcon: {
      shadowColor: '#0d0e13',
      shadowOpacity: 0.55,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 1 },
    },
    pillLabel: {
      color: t.white,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
      textShadowColor: 'rgba(13,14,19,0.5)',
      textShadowRadius: 6,
    },
    dot: {
      position: 'absolute',
      top: 9,
      right: 15,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.cream,
    },
    dotWide: { top: 8, right: 18 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(2.5),
      backgroundColor: t.field,
      borderRadius: radius.pill,
      paddingHorizontal: space(4),
      paddingVertical: space(2),
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: '#465064',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    searchInput: { flex: 1, fontSize: 16, color: t.ink, paddingVertical: space(1) },
    cancel: { color: t.accent, fontSize: 15, fontWeight: '600' },
  })
