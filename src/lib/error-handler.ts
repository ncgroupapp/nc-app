import { showSnackbar } from "@/components/ui/snackbar";

/**
 * Extrae el mensaje de error de una respuesta de Axios o error genérico.
 * @param error El objeto de error capturado.
 * @returns Un string con el mensaje de error legible.
 */
export function getErrorMessage(error: any): string {
  if (!error) return "Ocurrió un error inesperado";

  // Error de respuesta del backend (Axios)
  if (error.response?.data) {
    const data = error.response.data;
    
    // El backend estandarizado pone el mensaje en 'data' (vía AllExceptionsFilter)
    if (data.data && typeof data.data === 'string') {
      return data.data;
    }
    
    // NestJS default pone el mensaje en 'message'
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
    
    // Caso de array de mensajes (flattened en el back, pero por si acaso)
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }

    // Si data es un string directamente
    if (typeof data === 'string') {
      return data;
    }
  }

  // Error de red o sin respuesta
  if (error.request) {
    return "No se pudo conectar con el servidor. Verifique su conexión.";
  }

  // Error de configuración o error de JS
  if (error.message) {
    // Evitar mensajes técnicos crípticos si es posible
    if (error.message === 'Network Error') {
      return "Error de red. Verifique su conexión a internet.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado";
}

/**
 * Procesa un error y muestra un snackbar con el mensaje correspondiente.
 * @param error El objeto de error capturado.
 * @param fallbackMessage Mensaje opcional a mostrar si no se puede extraer uno del error.
 */
export function handleActionError(error: any, fallbackMessage?: string): void {
  const message = getErrorMessage(error);
  showSnackbar(message || fallbackMessage || "Error al procesar la solicitud", "error");
}
