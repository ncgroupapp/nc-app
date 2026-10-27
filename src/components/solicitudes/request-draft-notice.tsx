'use client'

import { AlertTriangle, CalendarClock, CheckCircle2, FileWarning, Loader2, PackageX, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LicitacionDraft } from '@/services/solicitudes.service'

interface RequestDraftNoticeProps {
  draft: LicitacionDraft | null
  isLoading: boolean
  /** Products already added to the licitation, to hide the "Agregar" button. */
  addedProductIds: number[]
  onAddProduct: (productId: number, quantity: number | null) => void
}

/**
 * What was read from the request's mail and PDFs: closing date, products found in the
 * catalog, and a warning for requested items that are not loaded in the app.
 */
export function RequestDraftNotice({ draft, isLoading, addedProductIds, onAddProduct }: RequestDraftNoticeProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand-blue/20 bg-[#F4F8FC] p-3 text-sm text-brand-navy">
        <Loader2 className="h-4 w-4 animate-spin" /> Leyendo el mail y los PDF de la solicitud…
      </div>
    )
  }
  if (!draft) return null

  const matched = draft.products.filter((p) => !p.ambiguous)
  const ambiguous = draft.products.filter((p) => p.ambiguous)
  const unreadable = draft.sources.filter((s) => !s.readable)

  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-lg border border-brand-blue/20 bg-[#F4F8FC] p-3 text-sm">
        <div className="flex items-start gap-2 text-brand-navy">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
          {draft.deadline ? (
            <span>
              Cierre leído del pedido: <b>{new Date(draft.deadline.date).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: draft.deadline.hasTime ? 'short' : undefined })}</b>
              {!draft.deadline.hasTime && ' (sin hora: completala)'}
              <span className="block text-xs text-muted-foreground">“{draft.deadline.evidence}”</span>
            </span>
          ) : (
            <span>No encontré la fecha de cierre en el mail ni en los PDF: completala a mano.</span>
          )}
        </div>
        {matched.length > 0 && (
          <div className="flex items-start gap-2 text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {matched.length} {matched.length === 1 ? 'producto cargado se agregó' : 'productos cargados se agregaron'} solos (pestaña Productos Solicitados).
            </span>
          </div>
        )}
      </div>

      {ambiguous.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Elegí cuál corresponde (comparten el mismo código)
          </div>
          {ambiguous.map((p) => (
            <div key={p.productId} className="flex items-center justify-between gap-2 pl-6">
              <span>
                {p.name} {p.code && <span className="font-mono text-xs">[{p.code}]</span>} · código pedido {p.matchedCode}
              </span>
              {!addedProductIds.includes(p.productId) && (
                <Button type="button" size="sm" variant="outline" className="h-7" onClick={() => onAddProduct(p.productId, p.quantity)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Agregar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {draft.unmatched.length > 0 && (
        <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <PackageX className="h-4 w-4" />
            {draft.unmatched.length} {draft.unmatched.length === 1 ? 'producto pedido no está cargado' : 'productos pedidos no están cargados'} en la app
          </div>
          <ul className="max-h-32 list-disc space-y-0.5 overflow-y-auto pl-10">
            {draft.unmatched.map((line, index) => (
              <li key={index}>
                {line.quantity !== null && <b>{line.quantity} × </b>}
                {line.description}
              </li>
            ))}
          </ul>
          <p className="pl-6 text-xs">Cargalos en Productos y después agregalos a la licitación.</p>
        </div>
      )}

      {unreadable.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No pude leer {unreadable.map((s) => s.name).join(', ')} (parece escaneado o es una imagen). Revisalo a mano para
            completar los productos y la fecha de cierre.
          </span>
        </div>
      )}
    </div>
  )
}
