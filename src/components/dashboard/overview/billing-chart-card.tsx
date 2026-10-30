'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DashboardOverview } from '@/services/dashboard.service'
import { formatCompactMoney, formatFullMoney, longMonth, shortMonth } from './format'

type Currency = 'UYU' | 'USD'

/** Rounds the top of the axis to a readable step (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(value: number): number {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10
  return step * power
}

/** Net billing (invoices minus credit notes) of the last 12 months. */
export function BillingChartCard({ data }: { data: DashboardOverview['billing'] }) {
  const hasUsd = data.monthly.some((m) => m.USD !== 0)
  const [currency, setCurrency] = useState<Currency>('UYU')
  const [hovered, setHovered] = useState<number | null>(null)

  const values = data.monthly.map((m) => Math.max(0, m[currency]))
  const top = niceMax(Math.max(...values, 0))
  const ticks = [1, 0.5, 0].map((f) => top * f)
  const last = data.monthly.length - 1
  const empty = values.every((v) => v === 0)

  return (
    <Card className="gap-0 rounded-2xl p-0 shadow-xs">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
        <div>
          <h2 className="text-[15px] font-bold">Facturación neta por mes</h2>
          <p className="text-[12.5px] text-muted-foreground">
            Facturas menos notas de crédito, en {currency === 'UYU' ? 'pesos' : 'dólares'}
          </p>
        </div>
        {hasUsd && (
          <div className="inline-flex rounded-[9px] bg-muted p-[3px]" role="group" aria-label="Moneda">
            {(['UYU', 'USD'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={cn(
                  'rounded-[7px] px-2.5 py-1 text-xs font-semibold text-muted-foreground',
                  currency === c && 'bg-white text-brand-navy shadow-sm',
                )}
              >
                {c === 'UYU' ? 'Pesos' : 'Dólares'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-4 md:px-5 md:pb-5">
        {empty ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            Todavía no hay facturas cargadas.
            <Link href="/dashboard/facturacion" className="font-semibold text-brand-blue hover:underline">Ir a Facturación</Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative h-36 w-12 shrink-0 text-[11px] text-muted-foreground" aria-hidden="true">
              {ticks.map((tick, i) => (
                <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - tick / top) * 100}%` }}>
                  {tick === 0 ? '0' : formatCompactMoney(tick, currency).replace(/^(US)?\$\s/, '')}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="relative h-36" onMouseLeave={() => setHovered(null)}>
                {ticks.map((tick, i) => (
                  <div
                    key={i}
                    className={cn('absolute inset-x-0 border-t', tick === 0 ? 'border-slate-300' : 'border-slate-100')}
                    style={{ top: `${(1 - tick / top) * 100}%` }}
                    aria-hidden="true"
                  />
                ))}
                <div className="absolute inset-0 flex items-end gap-[2px] sm:gap-1.5">
                  {data.monthly.map((month, i) => {
                    const value = values[i]
                    const isLast = i === last
                    return (
                      <button
                        key={month.month}
                        type="button"
                        className="group relative flex h-full flex-1 items-end justify-center focus:outline-none"
                        onMouseEnter={() => setHovered(i)}
                        onFocus={() => setHovered(i)}
                        onBlur={() => setHovered(null)}
                        aria-label={`${longMonth(month.month)}: ${formatFullMoney(month[currency], currency)}`}
                      >
                        <span
                          className={cn(
                            'w-full max-w-[30px] rounded-t-[4px] transition-colors',
                            isLast ? 'bg-brand-blue' : 'bg-[#9CC8EA] group-hover:bg-[#6FAEDF]',
                            hovered === i && !isLast && 'bg-[#6FAEDF]',
                          )}
                          style={{ height: `${(value / top) * 100}%`, minHeight: value > 0 ? 2 : 0 }}
                        />
                        {isLast && hovered === null && value > 0 && (
                          <span
                            className="absolute right-0 whitespace-nowrap text-xs font-bold text-foreground"
                            style={{ bottom: `calc(${(value / top) * 100}% + 4px)` }}
                          >
                            {formatCompactMoney(value, currency)}
                          </span>
                        )}
                        {hovered === i && (
                          <span
                            className={cn(
                              'pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-[#121A2E] px-2.5 py-1.5 text-left shadow-lg',
                              i > last / 2 ? 'right-0' : 'left-0',
                            )}
                            style={{ bottom: `calc(${(value / top) * 100}% + 8px)` }}
                          >
                            <span className="block text-[10.5px] capitalize text-[#AEB8CC]">{longMonth(month.month)}</span>
                            <span className="block text-[13px] font-bold text-white">{formatFullMoney(month[currency], currency)}</span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="mt-1.5 flex gap-[2px] sm:gap-1.5" aria-hidden="true">
                {data.monthly.map((month, i) => (
                  <span
                    key={month.month}
                    className={cn('flex-1 text-center text-[10px] text-muted-foreground sm:text-[11px]', i === last && 'font-bold text-foreground')}
                  >
                    {shortMonth(month.month)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[12.5px] text-muted-foreground">
          <span>
            Acumulado del año <b className="text-foreground">{formatCompactMoney(data.yearToDate[currency], currency)}</b>
          </span>
          <span>
            Notas de crédito <b className="text-amber-700">− {formatCompactMoney(data.creditNotesYear[currency], currency)}</b>
          </span>
        </div>
      </div>
    </Card>
  )
}
