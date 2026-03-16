import axios from 'axios';
import { getClientCookie, removeClientCookie } from './utils';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  async (config) => {
    let token = null;

    if (typeof window !== 'undefined') {
      // Client-side
      token = getClientCookie('backend_token');
    } else {
      // Server-side
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        token = cookieStore.get('backend_token')?.value;
      } catch (error) {
        console.error('Error accessing cookies in axios interceptor:', error);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptores para manejo de errores o tokens si fuera necesario
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        removeClientCookie('backend_token');
        // Solo redireccionar si no estamos ya en /login para evitar recargas infinitas
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
