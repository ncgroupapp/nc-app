export enum QuotationStatus {
  CREATED = 'creada',
  FINALIZED = 'finalizada',
  DRAFT = 'borrador',
  SENT = 'enviada',
  REJECTED = 'rechazada',
}

export enum QuotationAwardStatus {
  AWARDED = 'adjudicado',
  PARTIALLY_AWARDED = 'adjudicado_parcialmente',
  NOT_AWARDED = 'no_adjudicado',
  PENDING = 'en_espera',
}

export enum Currency {
  UYU = 'UYU',
  USD = 'USD',
  EUR = 'EUR',
}

export enum AdjudicationStatus {
  PARTIAL = 'parcial',
  TOTAL = 'total',
}
