import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ClientesStore } from './types';
import { clientesService } from '@/services/clientes.service';
import { PaginationMeta } from '@/types';

const getErrorMessage = (error: unknown): string => {
  const err = error as any;
  if (err.code === 'ERR_NETWORK') {
    return 'Error de conexión: No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.';
  }
  if (err.response?.status === 401) {
    return 'Sesión expirada. Por favor inicie sesión nuevamente.';
  }
  return err.message || 'Ocurrió un error inesperado';
};

const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  page: 1,
  lastPage: 1,
  limit: 10,
};

export const useClientesStore = create<ClientesStore>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      clientes: [],
      selectedCliente: null,
      isLoading: false,
      error: null,
      pagination: DEFAULT_PAGINATION,
      filters: {
        search: '',
      },

      // Actions
      fetchClientes: async (page = 1) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        const { filters } = get();
        try {
          const response = await clientesService.getAll(page, filters.search);
          console.log('fetchClientes response:', response);
          
          set((state) => {
            if (response.success && response.data && response.meta) {
              state.clientes = response.data;
              state.pagination = response.meta;
              state.isLoading = false;
            } else {
              state.error = 'Formato de respuesta inválido';
              state.isLoading = false;
            }
          });
        } catch (error) {
          console.error('fetchClientes error:', error);
          set((state) => {
            state.error = getErrorMessage(error);
            state.isLoading = false;
          });
        }
      },

      createCliente: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const response = await clientesService.create(data);          
          if (response.success) {
            set((state) => {
              state.clientes.push(response.data);
              state.isLoading = false;
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          set((state) => {
            state.error = getErrorMessage(error);
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateCliente: async (id, data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const response = await clientesService.update(id, data);
          if (response.success) {
            set((state) => {
              const index = state.clientes.findIndex((c) => c.id === id);
              if (index !== -1) {
                state.clientes[index] = response.data;
              }
              if (state.selectedCliente?.id === id) {
                state.selectedCliente = response.data;
              }
              state.isLoading = false;
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          set((state) => {
            state.error = getErrorMessage(error);
            state.isLoading = false;
          });
          throw error;
        }
      },

      deleteCliente: async (id) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          // Check for licitaciones before deleting
          // const hasLicitaciones = await clientesService.hasLicitaciones(id);
          // if (hasLicitaciones) {
          //   throw new Error('No se puede eliminar el cliente porque tiene licitaciones asociadas.');
          // }

          const response = await clientesService.delete(id);
          if (response.success) {
            set((state) => {
              state.clientes = state.clientes.filter((c) => c.id !== id);
              if (state.selectedCliente?.id === id) {
                state.selectedCliente = null;
              }
              state.isLoading = false;
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          set((state) => {
            state.error = getErrorMessage(error);
            state.isLoading = false;
          });
          throw error;
        }
      },

      setSelectedCliente: (cliente) => {
        set((state) => {
          state.selectedCliente = cliente;
        });
      },

      setFilters: (filters) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      setCurrentPage: (page) => {
        set((state) => {
          state.pagination.page = page;
        });
      },

      resetError: () => {
        set((state) => {
          state.error = null;
        });
      },
    }))
  )
);
