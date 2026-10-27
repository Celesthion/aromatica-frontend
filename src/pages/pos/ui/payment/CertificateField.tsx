import { Ticket, X } from 'lucide-react'
import { Button, ButtonSpinner, Input } from '@/shared/ui'
import { money } from '@/shared/lib/format'
import type { CertificatePayment } from './useCertificatePayment'

/** Поле сертификата в окне оплаты; принятый сертификат показывается плашкой с суммой списания. */
export function CertificateField({
  certificate,
  amountMinor,
}: {
  certificate: CertificatePayment
  amountMinor: number
}) {
  const { cert, code, error, checking } = certificate
  return (
    <div className="mb-3">
      {cert?.payable ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.06] px-3 py-2 text-sm">
          <Ticket className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.7} />
          <span className="min-w-0 flex-1 truncate">
            {cert.code}
            <span className="text-muted-foreground"> · остаток {money(cert.balanceMinor)}</span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums">−{money(amountMinor)}</span>
          <button
            type="button"
            title="Убрать сертификат"
            className="shrink-0 text-muted-foreground transition hover:text-foreground"
            onClick={certificate.remove}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
          <Input
            className="h-10 flex-1"
            value={code}
            placeholder="Код сертификата"
            onChange={(e) => certificate.changeCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void certificate.apply()
            }}
          />
          <Button
            variant="outline"
            className="h-10"
            disabled={!code.trim() || checking}
            onClick={() => void certificate.apply()}
          >
            {checking ? <ButtonSpinner /> : 'Применить'}
          </Button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
