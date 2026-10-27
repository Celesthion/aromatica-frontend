import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation, useRouter } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { groupProducts } from '@/pages/pos/lib/grouping'
import { remainingQty } from '@/pages/pos/lib/stock'
import type { ProductGroup } from '@/pages/pos/lib/types'
import { fetchProductKinds, searchPosProducts, type PosProduct, queryKeys } from '@/shared/api'
import { money, qtyFmt } from '@/shared/lib/format'
import { kindAccent } from '@/shared/lib/kinds'
import { AppHeader } from '~/components/AppHeader'
import { Button } from '~/components/Button'
import { Sheet } from '~/components/Sheet'
import { useCart } from '~/features/pos/cart'
import { CheckoutSheet } from '~/features/pos/checkout/CheckoutSheet'
import { CustomerSheet } from '~/features/pos/CustomerSheet'
import { kindIcon } from '~/features/pos/kindIcons'
import { PosBottomBar } from '~/features/pos/PosBottomBar'
import { ProductTile } from '~/features/pos/ProductTile'
import { useAtomizers, useShift } from '~/features/pos/queries'
import { useSplit } from '~/features/pos/splitStore'
import { useDebounced } from '~/hooks/useDebounced'
import { useIsWide } from '~/hooks/useIsWide'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'

const TILE_WIDTH = 165

export default function PosScreen() {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const columns = Math.max(2, Math.min(6, Math.round(width / TILE_WIDTH)))
  const wide = useIsWide()

  const [search, setSearch] = useState('')
  const query = useDebounced(search.trim())

  const shift = useShift()
  const warehouseId = shift.data?.warehouseId

  const products = useQuery({
    queryKey: queryKeys.pos.products.search(query, warehouseId),
    queryFn: () => searchPosProducts(query, warehouseId),
    enabled: !!shift.data,
  })
  const kinds = useQuery({
    queryKey: queryKeys.pos.kinds,
    queryFn: () => fetchProductKinds(),
    staleTime: 10 * 60_000,
  })
  // прогреваем кэш для /split
  useAtomizers(warehouseId, !!shift.data)

  const kindByCode = useMemo(() => new Map((kinds.data ?? []).map((k) => [k.code, k])), [kinds.data])

  const [kindFilter, setKindFilter] = useState<string | null>(null)
  const groups = useMemo(() => groupProducts(products.data ?? []), [products.data])
  const kindCodes = useMemo(() => [...new Set(groups.map((g) => g.kind))], [groups])
  const shown = useMemo(
    () => (kindFilter ? groups.filter((g) => g.kind === kindFilter) : groups),
    [groups, kindFilter],
  )

  const lines = useCart((s) => s.lines)
  const add = useCart((s) => s.add)
  const customer = useCart((s) => s.customer)

  const [variantsOf, setVariantsOf] = useState<ProductGroup | null>(null)
  const setSplitProduct = useSplit((s) => s.setProduct)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  // высота нижней панели, на неё сдвигается низ списка
  const [barHeight, setBarHeight] = useState(0)

  function pick(p: PosProduct) {
    setVariantsOf(null)
    if (p.unit === 'ML') {
      // распив отдельным экраном: RN Modal на Android не перерисовывается и не отдаёт фокус вводу
      setSplitProduct(p)
      router.push('/split')
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      add(p, 1, p.priceMinor ?? 0)
    }
  }

  if (shift.isPending)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={t.ink} />
      </View>
    )

  if (shift.isError && !shift.data)
    return (
      <ShiftNotice
        subtitle="Нет связи"
        title="Не удалось загрузить смену"
        hint="Проверьте связь и повторите."
        action="Повторить"
        onAction={() => void shift.refetch()}
      />
    )

  if (!shift.data)
    return (
      <ShiftNotice
        subtitle="Смена закрыта"
        title="Смена закрыта"
        hint="Чтобы пробивать чеки, откройте смену."
        action="К смене"
        onAction={() => router.navigate('/shift')}
      />
    )

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ height: insets.top + space(2) }} />

      {products.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.ink} />
        </View>
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={pad(shown, columns)}
          keyExtractor={(g, i) => g?.key ?? `pad${i}`}
          numColumns={columns}
          columnWrapperStyle={{ gap: space(2.5) }}
          contentContainerStyle={{
            padding: space(4),
            gap: space(2.5),
            // карточки проезжают под стеклом панели, последний ряд встаёт над ней
            paddingBottom: barHeight,
          }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyList}>{query ? 'Ничего не нашлось' : 'Начните вводить название'}</Text>
          }
          renderItem={({ item }) =>
            item ? (
              <ProductTile
                group={item}
                kindLabel={kindByCode.get(item.kind)?.name}
                KindIcon={kindIcon(item.kind, kindByCode.get(item.kind)?.icon)}
                kindColor={kindAccent(item.kind, kindByCode.get(item.kind)?.color)}
                onPress={() => (item.variants.length === 1 ? pick(item.variants[0]) : setVariantsOf(item))}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )
          }
        />
      )}

      <PosBottomBar
        searchOpen={searchOpen}
        onOpenSearch={() => setSearchOpen(true)}
        onCloseSearch={() => {
          setSearchOpen(false)
          setSearch('')
        }}
        search={search}
        onChangeSearch={setSearch}
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
        lineCount={lines.length}
        onReceipt={() => setReceiptOpen(true)}
        onCustomer={() => setCustomerOpen(true)}
        customerName={customer?.name ?? null}
        wide={wide}
        onHeight={setBarHeight}
        chips={
          kindCodes.length > 1 ? (
            <FlatList
              data={[null, ...kindCodes]}
              keyExtractor={(k) => k ?? 'all'}
              horizontal
              showsHorizontalScrollIndicator={false}
              // лента по центру, а если не помещается, прокручивается от края
              contentContainerStyle={{
                gap: space(2),
                paddingHorizontal: space(4),
                flexGrow: 1,
                justifyContent: 'center',
              }}
              renderItem={({ item }) => {
                const on = kindFilter === item
                return (
                  <Pressable onPress={() => setKindFilter(item)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && { color: t.primaryText }]}>
                      {item === null ? 'Все' : (kindByCode.get(item)?.name ?? item)}
                    </Text>
                  </Pressable>
                )
              }}
            />
          ) : null
        }
      />

      <CustomerSheet visible={customerOpen} onClose={() => setCustomerOpen(false)} />

      <CheckoutSheet
        visible={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        shiftId={shift.data.id}
        warehouseId={warehouseId}
      />

      <Sheet visible={!!variantsOf} title={variantsOf?.title ?? ''} onClose={() => setVariantsOf(null)}>
        {variantsOf?.variants.map((v) => {
          const left = remainingQty(lines, v)
          return (
            <Pressable
              key={v.id}
              disabled={left <= 0}
              onPress={() => pick(v)}
              style={({ pressed }) => [styles.row, (pressed || left <= 0) && { opacity: 0.5 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {v.label ?? (v.volumeMl != null ? `${qtyFmt(v.volumeMl)} мл` : v.name)}
                </Text>
                <Text style={styles.rowHint}>
                  Остаток {qtyFmt(left)}
                  {v.unit === 'ML' ? ' мл' : ''}
                </Text>
              </View>
              <Text style={styles.rowPrice}>
                {v.priceMinor ? `${money(v.priceMinor)}${v.unit === 'ML' ? '/мл' : ''}` : '—'}
              </Text>
            </Pressable>
          )
        })}
      </Sheet>
    </View>
  )
}

function ShiftNotice({
  subtitle,
  title,
  hint,
  action,
  onAction,
}: {
  subtitle: string
  title: string
  hint: string
  action: string
  onAction: () => void
}) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader title="Касса" subtitle={subtitle} />
      <View style={[styles.center, { padding: space(5) }]}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptyHint}>{hint}</Text>
          <Button title={action} onPress={onAction} />
        </View>
      </View>
    </View>
  )
}

/** Добивает последний ряд пустышками, чтобы плитки не растягивались. */
function pad(list: ProductGroup[], columns: number): (ProductGroup | null)[] {
  const tail = list.length % columns
  return tail === 0 ? list : [...list, ...Array<null>(columns - tail).fill(null)]
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background },

    chip: {
      paddingHorizontal: space(4),
      paddingVertical: space(2),
      borderRadius: radius.pill,
      backgroundColor: t.tile,
      borderWidth: 1,
      borderColor: t.tileEdge,
      shadowColor: '#465064',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    },
    chipOn: { backgroundColor: t.primary, borderColor: 'transparent' },
    chipText: { fontSize: 14, fontWeight: '600', color: t.ink },

    emptyList: { textAlign: 'center', color: t.muted, marginTop: space(12) },
    emptyCard: {
      width: '100%',
      backgroundColor: t.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: t.border,
      padding: space(5),
      gap: space(3),
      shadowColor: t.shadowColor,
      shadowOpacity: t.shadowOpacity,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: t.ink },
    emptyHint: { fontSize: 14, color: t.muted },

    // строка шторки вариантов
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(4),
    },
    rowTitle: { fontSize: 15, fontWeight: '600', color: t.ink },
    rowHint: { fontSize: 13, color: t.muted },
    rowPrice: { fontSize: 15, fontWeight: '700', color: t.ink },
  })
