"use client"

import { toast } from "sonner"

type SnackbarType = "success" | "error" | "warning" | "info" | "default"

interface SnackbarOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const showSnackbar = (
  message: string,
  type: SnackbarType = "default",
  options?: SnackbarOptions
) => {
  const toastOptions = {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  }

  switch (type) {
    case "success":
      toast.success(message, toastOptions)
      break
    case "error":
      toast.error(message, toastOptions)
      break
    case "warning":
      toast.warning(message, toastOptions)
      break
    case "info":
      toast.info(message, toastOptions)
      break
    default:
      toast(message, toastOptions)
      break
  }
}
