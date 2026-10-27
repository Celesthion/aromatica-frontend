const RAIL_GLASS =
  'border border-glass-line-quiet bg-glass-quiet text-muted-foreground backdrop-blur-xl backdrop-saturate-150 hover:border-glass-line hover:bg-glass-hover hover:text-foreground'

export const RAIL_BTN = `grid h-10 w-10 place-items-center rounded-full transition-colors ${RAIL_GLASS}`

export function railItemClass(active: boolean): string {
  return `relative z-10 grid h-10 w-10 place-items-center rounded-full transition-colors duration-300 ${
    active ? 'text-cta-ink' : RAIL_GLASS
  }`
}
