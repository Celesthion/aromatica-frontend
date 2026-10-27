import { useState } from 'react'
import { checkGiftCertificate, type GiftCheck } from '@/shared/api'
import { isValidGiftCode, looksLikeGiftCode, normalizeGiftCode } from '@/shared/lib/giftCode'

/** Оплата сертификатом: введённый код и ответ сервера по нему. */
export function useCertificatePayment() {
  const [code, setCode] = useState('')
  const [cert, setCert] = useState<GiftCheck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // остаток и возможность оплаты знает только сервер
  const apply = async () => {
    // опечатку в коде нового формата ловит контрольная цифра, до сервера
    if (looksLikeGiftCode(code) && !isValidGiftCode(code)) {
      setError('В коде опечатка — сверьте цифры с бланком')
      setCert(null)
      return
    }
    setChecking(true)
    setError(null)
    try {
      const found = await checkGiftCertificate(normalizeGiftCode(code))
      if (!found.payable) {
        setError(found.reason ?? 'Этим сертификатом платить нельзя')
        setCert(null)
        return
      }
      setCert(found)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось проверить сертификат')
    } finally {
      setChecking(false)
    }
  }

  return {
    code,
    cert,
    error,
    checking,
    apply,
    changeCode: (value: string) => {
      setCode(value)
      setError(null)
    },
    remove: () => {
      setCert(null)
      setCode('')
      setError(null)
    },
  }
}

export type CertificatePayment = ReturnType<typeof useCertificatePayment>
