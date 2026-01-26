import { create } from 'zustand'

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

type ConfirmStore = {
  isOpen: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
  handleConfirm: () => void
  handleCancel: () => void
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  options: { message: '' },
  resolve: null,
  confirm: (options) => {
    const parsedOptions = typeof options === 'string' ? { message: options } : options
    return new Promise((resolve) => {
      set({
        isOpen: true,
        options: {
          title: 'Confirmación',
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          variant: 'default',
          ...parsedOptions
        },
        resolve,
      })
    })
  },
  handleConfirm: () => {
    const { resolve } = get()
    if (resolve) resolve(true)
    set({ isOpen: false, resolve: null })
  },
  handleCancel: () => {
    const { resolve } = get()
    if (resolve) resolve(false)
    set({ isOpen: false, resolve: null })
  },
}))
