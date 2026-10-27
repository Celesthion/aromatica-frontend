import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Star, Trash2 } from 'lucide-react'
import {
  deleteProductModelImage,
  fetchProductModelImages,
  imageUrl,
  makeProductModelImageMain,
  uploadProductModelImage,
  queryKeys,
} from '@/shared/api'
import { ButtonSpinner } from '@/shared/ui'

const MAX_SIDE = 1200
// небольшой файл без уменьшения отправляем как есть
const MAX_KEEP_BYTES = 900_000

// сжимаем в JPEG до MAX_SIDE, при ошибке отправляем оригинал
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < MAX_KEEP_BYTES) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

/** Галерея фото продукта. Фото общие для всех товаров продукта. */
export function ProductImages({ modelId }: { modelId: string }) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const key = queryKeys.productModels.images(modelId)
  const images = useQuery({ queryKey: key, queryFn: () => fetchProductModelImages(modelId) })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: key })
    // основное фото показывают списки и касса
    queryClient.invalidateQueries({ queryKey: queryKeys.productModels.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
  }
  const fail = (e: Error) => setError(e.message)

  const upload = useMutation({
    mutationFn: async (file: File) => uploadProductModelImage(modelId, await shrink(file)),
    onSuccess: () => {
      setError(null)
      invalidate()
    },
    onError: fail,
  })
  const setMain = useMutation({
    mutationFn: makeProductModelImageMain,
    onSuccess: invalidate,
    onError: fail,
  })
  const remove = useMutation({
    mutationFn: deleteProductModelImage,
    onSuccess: invalidate,
    onError: fail,
  })

  const list = images.data ?? []

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {list.map((img) => (
          <div
            key={img.id}
            className={`group relative h-24 w-24 overflow-hidden rounded-xl border ${
              img.main ? 'border-foreground' : 'border-border/60'
            }`}
          >
            <img src={imageUrl(img.id)} alt="" className="h-full w-full object-cover" />
            {img.main && (
              <span className="absolute left-1 top-1 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                основная
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!img.main && (
                <button
                  type="button"
                  title="Сделать основной"
                  onClick={() => setMain.mutate(img.id)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-foreground transition hover:bg-white"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                title="Удалить фотографию"
                onClick={() => remove.mutate(img.id)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-brand-bad transition hover:bg-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="grid h-24 w-24 place-items-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
        >
          {upload.isPending ? (
            <ButtonSpinner size="lg" />
          ) : (
            <ImagePlus className="h-5 w-5" strokeWidth={1.6} />
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // тот же файл можно выбрать повторно
          if (file) upload.mutate(file)
        }}
      />

      {list.length > 1 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Основная фотография показывается в карточках кассы, списке товаров и чеке.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-brand-bad">{error}</p>}
    </div>
  )
}

export function ProductImagesHint() {
  return (
    <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
      Сохраните продукт — после этого сюда можно будет загрузить фотографии.
    </p>
  )
}
