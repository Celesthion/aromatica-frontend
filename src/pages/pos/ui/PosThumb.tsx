import { imageUrl } from '@/shared/api'

/** Превью товара: фото или нарисованный флакон; tile: плитка 40x40 для строк, fill: на всю карточку. */
export function PosThumb({
  kind,
  variant = 'fill',
  imageId,
}: {
  kind: string
  variant?: 'tile' | 'fill'
  imageId?: string | null
}) {
  const pourable = kind === 'SPLIT' || kind === 'BULK'
  const pack = kind === 'PACKAGING' || kind === 'ATOMIZER'
  const surface = pourable
    ? 'bg-gradient-to-br from-tint-pour to-tint-pour-deep'
    : pack
      ? 'bg-gradient-to-br from-tint-pack to-tint-pack-deep'
      : 'bg-gradient-to-br from-tint-bottle to-tint-bottle-deep'
  const body = pourable
    ? 'from-tint-amber to-tint-amber-deep'
    : pack
      ? 'from-tint-green to-tint-green-deep'
      : 'from-tint-slate to-brand-slate'

  if (variant === 'tile') {
    if (imageId) {
      return (
        <img
          src={imageUrl(imageId)}
          alt=""
          loading="lazy"
          // contain: флакон вытянут по вертикали, cover срезал бы крышку и дно
          className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.06] object-contain p-0.5"
        />
      )
    }
    return (
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.07]">
        <span className="absolute left-1/2 top-1.5 h-1 w-1 -translate-x-1/2 rounded-[2px] bg-brand-slate-deep" />
        <span
          className={`absolute left-1/2 top-[9px] h-5 -translate-x-1/2 rounded-[3px] bg-gradient-to-b ${body} ${
            pourable ? 'w-1.5' : 'w-2'
          }`}
        />
      </span>
    )
  }

  if (imageId) {
    return (
      <img
        src={imageUrl(imageId)}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }
  return (
    <span className={`absolute inset-0 flex items-center justify-center ${surface}`}>
      <span className="flex flex-col items-center drop-shadow-[0_3px_5px_rgba(40,40,43,0.18)]">
        <span className="h-2 w-2 rounded-[2px] bg-brand-slate-deep" />
        <span className={`-mt-px h-10 rounded-[4px] bg-gradient-to-b ${body} ${pourable ? 'w-3' : 'w-4'}`} />
      </span>
    </span>
  )
}
