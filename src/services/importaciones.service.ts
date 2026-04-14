import api from '@/lib/axios'
import { ApiResponse, PaginatedResponse } from '@/types/api'
import { Importacion, CreateImportacionForm } from '@/types/importacion'

const LEGACY_RATE_KEYS: Array<[string, keyof CreateImportacionForm]> = [
  ['advanceVat', 'advanceVatRate'],
  ['transitGuide', 'transitGuideRate'],
  ['imaduni', 'imaduniRate'],
  ['vat', 'vatRate'],
  ['surcharge', 'surchargeRate'],
  ['consularFees', 'consularFeesRate'],
  ['tcu', 'tcuRate'],
  ['auriStamps', 'auriStampsRate'],
  ['tsa', 'tsaRate'],
  ['dispatchExpenses', 'dispatchExpensesRate'],
  ['customsSurcharge', 'customsSurchargeRate'],
  ['fees', 'feesRate'],
  ['externalFreight', 'externalFreightRate'],
  ['insuranceTax', 'insuranceTaxRate'],
  ['internalFreight', 'internalFreightRate'],
]

const toIsoDate = (date: string): string => {
  if (!date) return new Date().toISOString()
  if (date.includes('T')) return date
  return `${date}T00:00:00.000Z`
}

const normalizeImportPayload = (
  data: Partial<CreateImportacionForm>,
): Partial<CreateImportacionForm> => {
  const payload: Record<string, unknown> = { ...data }

  for (const [legacyKey, rateKey] of LEGACY_RATE_KEYS) {
    if (payload[rateKey] === undefined && payload[legacyKey] !== undefined) {
      payload[rateKey] = payload[legacyKey]
    }
    delete payload[legacyKey]
  }

  return payload as Partial<CreateImportacionForm>
}

export interface ImportacionFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  providerId?: string
  importDate?: string
  fromDate?: string
  toDate?: string
}

export const importacionesService = {
  getAll: async (
    filters: ImportacionFilters = {},
  ): Promise<PaginatedResponse<Importacion>> => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.providerId) params.append('providerId', filters.providerId)
    if (filters.importDate) params.append('importDate', filters.importDate)
    if (filters.fromDate) params.append('fromDate', filters.fromDate)
    if (filters.toDate) params.append('toDate', filters.toDate)
    const response = await api.get<PaginatedResponse<Importacion>>(
      `/imports?${params.toString()}`,
    )
    return response.data
  },

  getById: async (id: string): Promise<Importacion> => {
    const response = await api.get<ApiResponse<Importacion>>(
      `/imports/${id}`,
    )
    return response.data.data
  },

  create: async (data: CreateImportacionForm): Promise<Importacion> => {
    const payload = {
      ...normalizeImportPayload(data),
      importDate: toIsoDate(data.importDate),
    }
    const response = await api.post<ApiResponse<Importacion>>('/imports', payload)
    return response.data.data
  },

  update: async (
    id: string,
    data: Partial<CreateImportacionForm>,
  ): Promise<Importacion> => {
    if (
      !data.folder ||
      data.providerId === undefined ||
      !data.transport ||
      data.exchangeRate === undefined ||
      data.packageCount === undefined ||
      data.totalWeight === undefined ||
      !data.originCurrency ||
      !data.importDate
    ) {
      throw new Error('Payload incompleto para actualizar importación')
    }

    const payload = {
      ...normalizeImportPayload(data),
      importDate: toIsoDate(data.importDate),
    }
    const response = await api.patch<ApiResponse<Importacion>>(
      `/imports/${id}`,
      payload,
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/imports/${id}`)
  },

  changeEstado: async (
    id: string,
    status: Importacion['status'],
  ): Promise<Importacion> => {
    const response = await api.patch<ApiResponse<Importacion>>(
      `/imports/${id}`,
      { status },
    )
    return response.data.data
  },

  addLicitacion: async (
    id: string,
    licitacion_id: string,
  ): Promise<void> => {
    await api.post(`/imports/${id}/licitations`, { licitation_id: licitacion_id })
  },

  removeLicitacion: async (
    id: string,
    licitacion_id: string,
  ): Promise<void> => {
    await api.delete(`/imports/${id}/licitations/${licitacion_id}`)
  },
}
