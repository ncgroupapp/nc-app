export interface Cliente {
  id: string
  name: string
  identifier: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
  contacts?: Array<{ 
    name: string
    email?: string
    phone?: string
    address?: string
  }>
}

export interface ClienteResponse {
  success: boolean
  data: Cliente
  message: string
}

export interface CreateClienteForm {
  name: string
  identifier: string
  contacts?: Array<{
    name?: string
    email?: string
    phone?: string
    address?: string
  }>
}
