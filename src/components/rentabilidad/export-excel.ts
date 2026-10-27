import {
  PROFITABILITY_STATUS_LABELS,
  ProfitabilityItem,
  ProfitabilityReport,
} from '@/services/rentabilidad.service'

const MONEY = '#,##0.00'
const PERCENT = '0.0"%"'
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF16203A' } }

const ITEM_STATE_LABELS: Record<ProfitabilityItem['state'], string> = {
  ok: 'OK',
  sin_oferta: 'Sin oferta',
  sin_conversion: 'Moneda sin conversión',
}

const day = (iso: string) => new Date(iso).toLocaleDateString('es-UY')

/** Builds the .xlsx with the summary, one row per licitación and one per product, and downloads it. */
export async function exportProfitabilityToExcel(report: ProfitabilityReport): Promise<void> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'NC App'
  workbook.created = new Date()

  const { settings, summary } = report

  const resumen = workbook.addWorksheet('Resumen')
  resumen.columns = [{ width: 34 }, { width: 18 }]
  resumen.addRow(['Rentabilidad (USD)']).font = { bold: true, size: 14 }
  resumen.addRow([`Generado el ${new Date().toLocaleString('es-UY')}`])
  resumen.addRow([])
  const summaryRows: Array<[string, number | string | null, string?]> = [
    ['Tipo de cambio (UYU por 1 USD)', settings.exchangeRate ?? 'Sin cargar', '#,##0.0000'],
    ['Margen mínimo', settings.minMargin, PERCENT],
    ['Licitaciones', summary.licitations],
    ['Monto ofertado (USD)', summary.offeredUsd, MONEY],
    ['Venta con costo (USD)', summary.costedSaleUsd, MONEY],
    ['Costo (USD)', summary.costUsd, MONEY],
    ['Ganancia estimada (USD)', summary.profitUsd, MONEY],
    ['Margen promedio', summary.margin, PERCENT],
    ['Markup promedio', summary.markup, PERCENT],
    ['Ítems sin oferta', summary.itemsWithoutOffer],
    ['Licitaciones bajo el margen mínimo', summary.belowMinMargin],
  ]
  for (const [label, value, format] of summaryRows) {
    const row = resumen.addRow([label, value ?? '—'])
    row.getCell(1).font = { bold: true }
    if (format && typeof value === 'number') row.getCell(2).numFmt = format
  }

  const licitaciones = workbook.addWorksheet('Licitaciones', { views: [{ state: 'frozen', ySplit: 1 }] })
  licitaciones.columns = [
    { header: 'Licitación', key: 'callNumber', width: 18 },
    { header: 'N° interno', key: 'internalNumber', width: 14 },
    { header: 'Cliente', key: 'clientName', width: 34 },
    { header: 'Inicio', key: 'startDate', width: 12 },
    { header: 'Cierre', key: 'deadlineDate', width: 12 },
    { header: 'Estado', key: 'status', width: 12 },
    { header: 'Ofertado USD', key: 'offeredUsd', width: 15, style: { numFmt: MONEY } },
    { header: 'Venta con costo USD', key: 'costedSaleUsd', width: 18, style: { numFmt: MONEY } },
    { header: 'Costo USD', key: 'costUsd', width: 14, style: { numFmt: MONEY } },
    { header: 'Ganancia USD', key: 'profitUsd', width: 14, style: { numFmt: MONEY } },
    { header: 'Margen %', key: 'margin', width: 11, style: { numFmt: PERCENT } },
    { header: 'Markup %', key: 'markup', width: 11, style: { numFmt: PERCENT } },
    { header: 'Ítems sin oferta', key: 'itemsWithoutOffer', width: 15 },
  ]
  for (const l of report.licitations) {
    const row = licitaciones.addRow({
      ...l,
      internalNumber: l.internalNumber ?? '',
      startDate: day(l.startDate),
      deadlineDate: day(l.deadlineDate),
      status: PROFITABILITY_STATUS_LABELS[l.status],
      margin: l.margin ?? '—',
      markup: l.markup ?? '—',
    })
    if (l.margin !== null) {
      row.getCell('margin').font = { bold: true, color: { argb: l.belowMinMargin ? 'FFC0392B' : 'FF0F7A43' } }
    }
  }

  const detalle = workbook.addWorksheet('Detalle por producto', { views: [{ state: 'frozen', ySplit: 1 }] })
  detalle.columns = [
    { header: 'Licitación', key: 'callNumber', width: 18 },
    { header: 'Cliente', key: 'clientName', width: 30 },
    { header: 'Producto', key: 'productName', width: 34 },
    { header: 'Código', key: 'productCode', width: 16 },
    { header: 'Cantidad', key: 'quantity', width: 10 },
    { header: 'Proveedor (oferta elegida)', key: 'providerName', width: 28 },
    { header: 'Costo unit.', key: 'unitCost', width: 12, style: { numFmt: MONEY } },
    { header: 'Moneda costo', key: 'costCurrency', width: 12 },
    { header: 'Venta unit.', key: 'unitSale', width: 12, style: { numFmt: MONEY } },
    { header: 'Moneda venta', key: 'saleCurrency', width: 12 },
    { header: 'Venta USD', key: 'saleUsd', width: 12, style: { numFmt: MONEY } },
    { header: 'Costo USD', key: 'costUsd', width: 12, style: { numFmt: MONEY } },
    { header: 'Ganancia USD', key: 'profitUsd', width: 13, style: { numFmt: MONEY } },
    { header: 'Margen %', key: 'margin', width: 10, style: { numFmt: PERCENT } },
    { header: 'Markup %', key: 'markup', width: 10, style: { numFmt: PERCENT } },
    { header: 'Estado', key: 'state', width: 20 },
  ]
  for (const l of report.licitations) {
    for (const item of l.items) {
      detalle.addRow({
        ...item,
        callNumber: l.callNumber,
        clientName: l.clientName,
        productCode: item.productCode ?? '',
        providerName: item.providerName ?? '',
        unitCost: item.unitCost ?? '',
        costCurrency: item.costCurrency ?? '',
        saleUsd: item.saleUsd ?? '',
        costUsd: item.costUsd ?? '',
        profitUsd: item.profitUsd ?? '',
        margin: item.margin ?? '',
        markup: item.markup ?? '',
        state: ITEM_STATE_LABELS[item.state],
      })
    }
  }

  for (const sheet of [licitaciones, detalle]) {
    const header = sheet.getRow(1)
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    header.fill = HEADER_FILL
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rentabilidad_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
