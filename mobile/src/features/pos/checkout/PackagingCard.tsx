import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ProductGroup } from '@/pages/pos/lib/types'
import type { PosProduct } from '@/shared/api'
import { money, qtyFmt } from '@/shared/lib/format'
import { light as colors, radius, space } from '~/theme'
import { checkoutStyles } from './checkoutStyles'
import { QtyStepper } from './QtyStepper'

/** Упаковка при оплате: продукт, под ним расфасовки; у продукта с одной вариацией сразу счётчик. */
export function PackagingCard({
  groups,
  qty,
  onQty,
  openKey,
  onOpen,
}: {
  groups: ProductGroup[]
  qty: Record<string, number>
  onQty: (productId: string, n: number) => void
  openKey: string | null
  onOpen: (key: string | null) => void
}) {
  return (
    <View style={checkoutStyles.payCard}>
      <Text style={checkoutStyles.rowLabel}>Упаковка</Text>
      {groups.map((g) => {
        const single = g.variants.length === 1
        const taken = g.variants.reduce((sum, v) => sum + (qty[v.id] ?? 0), 0)
        const open = openKey === g.key
        return (
          <View key={g.key} style={{ marginTop: space(3) }}>
            <View style={styles.pkgRow}>
              <Pressable
                onPress={() => (single ? undefined : onOpen(open ? null : g.key))}
                disabled={single}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Text style={styles.pkgName} numberOfLines={1}>
                  {g.model}
                </Text>
                <Text style={checkoutStyles.rowLabel}>
                  {single
                    ? `${money(g.variants[0].priceMinor ?? 0)} · остаток ${qtyFmt(g.variants[0].qty)}`
                    : `${g.variants.length} вар.${taken > 0 ? ` · выбрано ${taken}` : ''}`}
                </Text>
              </Pressable>

              {single ? (
                <PackagingStepper
                  product={g.variants[0]}
                  qty={qty[g.variants[0].id] ?? 0}
                  onChange={(n) => onQty(g.variants[0].id, n)}
                />
              ) : (
                <Pressable onPress={() => onOpen(open ? null : g.key)} hitSlop={8} style={styles.pkgOpen}>
                  <Text style={styles.pkgOpenText}>{open ? 'Свернуть' : 'Выбрать'}</Text>
                </Pressable>
              )}
            </View>

            {!single && open
              ? g.variants.map((v) => (
                  <View key={v.id} style={[styles.pkgRow, styles.pkgVariant]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.pkgVariantName} numberOfLines={1}>
                        {v.label ?? v.name}
                      </Text>
                      <Text style={checkoutStyles.rowLabel}>
                        {money(v.priceMinor ?? 0)} · остаток {qtyFmt(v.qty)}
                      </Text>
                    </View>
                    <PackagingStepper product={v} qty={qty[v.id] ?? 0} onChange={(n) => onQty(v.id, n)} />
                  </View>
                ))
              : null}
          </View>
        )
      })}
    </View>
  )
}

// не уходит в минус и не превышает остаток
function PackagingStepper({
  product,
  qty,
  onChange,
}: {
  product: PosProduct
  qty: number
  onChange: (n: number) => void
}) {
  return (
    <QtyStepper
      value={qty}
      onDec={() => onChange(Math.max(0, qty - 1))}
      onInc={() => onChange(Math.min(product.qty, qty + 1))}
    />
  )
}

const styles = StyleSheet.create({
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    marginTop: space(3),
  },
  pkgName: { fontSize: 14, color: colors.cream, fontWeight: '600' },
  pkgVariant: {
    marginTop: space(2),
    marginLeft: space(3),
    paddingLeft: space(3),
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.12)',
  },
  pkgVariantName: { fontSize: 13, color: 'rgba(244,245,247,0.85)' },
  pkgOpen: {
    paddingHorizontal: space(3.5),
    paddingVertical: space(2),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pkgOpenText: { color: colors.cream, fontSize: 12.5, fontWeight: '600' },
})
