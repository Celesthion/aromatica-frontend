import { useState } from 'react'

export interface Notice {
  text: string
  tone: 'good' | 'warn'
}

// краткий итог действия, гаснет через 6 с; warn для списания потерь
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const flash = (text: string, tone: Notice['tone'] = 'good') => {
    setNotice({ text, tone })
    window.setTimeout(() => setNotice(null), 6000)
  }
  return { notice, flash }
}
