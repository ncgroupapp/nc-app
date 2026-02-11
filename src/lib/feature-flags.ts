export const featureFlags = {
  licitaciones: process.env.NEXT_PUBLIC_FEATURE_LICITACIONES !== 'false',
  importaciones: process.env.NEXT_PUBLIC_FEATURE_IMPORTACIONES !== 'false',
  pdfs: process.env.NEXT_PUBLIC_FEATURE_PDFS !== 'false',
  configuracion: process.env.NEXT_PUBLIC_FEATURE_CONFIGURACION !== 'false',
} as const;
