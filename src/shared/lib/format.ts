/** Общие форматтеры денег, количества и дат; доменные словари в pages/admin/lib/labels.ts. */

const LOCALE = 'ru-RU'

/** Тыйыны в сомы без валюты: для <Money>, который рисует знак сома отдельно. */
export function amountText(minor: number): string {
  const som = minor / 100
  return som.toLocaleString(LOCALE, {
    minimumFractionDigits: Number.isInteger(som) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

/** Тыйыны в сомы строкой (печать, заголовки, атрибуты). */
export function money(minor: number): string {
  return `${amountText(minor)} с`
}

export function qtyFmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString(LOCALE, { maximumFractionDigits: 3 })
}

export function dateTimeFmt(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function dateFmt(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Дата YYYY-MM-DD по локальному времени (toISOString дал бы дату в UTC). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** ISO в значение для input[type=datetime-local] в локальном времени. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  return `${toIsoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const UNIT_LABELS = { PCS: 'шт', ML: 'мл' } as const

export const PERSON_GENDER_LABELS = { MALE: 'Мужской', FEMALE: 'Женский' } as const

/** Цвет суммы-дельты: минус красный, ноль и плюс брендовый зелёный. */
export function amountTone(n: number): string {
  return n < 0 ? 'text-red-600' : 'text-brand-green-dark'
}
