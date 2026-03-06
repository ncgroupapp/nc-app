export interface Brand {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
  models?: Model[]
}

export interface ResponseBrand {
  success: boolean
  data: Brand
}

export interface Model {
  id: number
  name: string
  brandId: number
  brand?: Brand
  createdAt?: string
  updatedAt?: string
}
