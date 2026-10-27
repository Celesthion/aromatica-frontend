import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Input } from './input'

export interface SearchInputHandle {
  focus: () => void
  /** Дописать символы и сфокусировать поле, например когда в кассе печатают мимо поля. */
  append: (text: string) => void
  clear: () => void
}

/**
 * Поле поиска с дебаунсом: onSearch получает обрезанную строку после паузы, которая
 * склеивает ввод сканера штрихкодов. Значение внутреннее, управлять можно через ref.
 */
export const SearchInput = forwardRef<
  SearchInputHandle,
  {
    onSearch: (q: string) => void
    /** Стартовый текст, чтобы набранное переживало уход на соседний экран. */
    initialValue?: string
    placeholder?: string
    /** Дебаунс, мс. */
    delay?: number
    autoFocus?: boolean
    className?: string
    /** Класс самого input, например высота h-10/h-12. */
    inputClassName?: string
    /** Клавиша в поле (Escape очищает); на дебаунс не влияет. */
    onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
    /** Крестик сброса справа, когда что-то набрано. Не сочетается с кнопкой фильтров в поле. */
    clearable?: boolean
  }
>(function SearchInput(
  {
    onSearch,
    initialValue = '',
    placeholder = 'Поиск…',
    delay = 300,
    autoFocus,
    className,
    inputClassName,
    onKeyDown,
    clearable,
  },
  ref,
) {
  const [text, setText] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  // колбэк родителя в ref, иначе его новый экземпляр на каждом рендере сбрасывал бы таймер
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  useEffect(() => {
    const t = setTimeout(() => onSearchRef.current(text.trim()), delay)
    return () => clearTimeout(t)
  }, [text, delay])

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    append: (s: string) => {
      setText((t) => t + s)
      inputRef.current?.focus()
    },
    clear: () => setText(''),
  }))

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        className={cn('pl-9', clearable && text && 'pr-8', inputClassName)}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
      />
      {clearable && text && (
        <button
          type="button"
          aria-label="Сбросить поиск"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setText('')
            inputRef.current?.focus()
          }}
          className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
})
