import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ClientesStore } from './types';
import { clientesService } from '@/services/clientes.service';
import { Cliente } from '@/types';

export const useClientesStore = create<ClientesStore>()(
  devtools(
    immer((set) => ({
      // Initial State
      clientes: [],
      selectedCliente: null,
      isLoading: false,
      error: null,
      filters: {
        search: '',
      },

      // Actions
      fetchClientes: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const response = await clientesService.getAll();
          console.log('fetchClientes response:', response);
          
          // Handle different response structures
          let data: Cliente[] = [];
          const rawResponse = response as unknown;

          if (Array.isArray(rawResponse)) {
            data = rawResponse as Cliente[];
          } else if (
            typeof rawResponse === 'object' && 
            rawResponse !== null && 
            'data' in rawResponse && 
            Array.isArray((rawResponse as { data: unknown }).data)
          ) {
            data = (rawResponse as { data: unknown[] }).data as Cliente[];
          } else if (
            typeof rawResponse === 'object' && 
            rawResponse !== null
          ) {
             // Try to find an array property if none of the above match
             const possibleArray = Object.values(rawResponse).find(val => Array.isArray(val));
             if (possibleArray) {
                data = possibleArray as Cliente[];
             }
          }

          if (data) {
            set((state) => {
              state.clientes = data;
              state.isLoading = false;
            });
          } else {
            console.error('fetchClientes failed: Invalid response format', response);
            set((state) => {
              state.error = 'Formato de respuesta inválido';
              state.isLoading = false;
            });
          }
        } catch (error) {
          console.error('fetchClientes error:', error);
          set((state) => {
            state.error = (error as Error).message;
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
            state.error = (error as Error).message;
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
            state.error = (error as Error).message;
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
          const hasLicitaciones = await clientesService.hasLicitaciones(id);
          if (hasLicitaciones) {
            throw new Error('No se puede eliminar el cliente porque tiene licitaciones asociadas.');
          }

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
            state.error = (error as Error).message;
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

      resetError: () => {
        set((state) => {
          state.error = null;
        });
      },
    }))
  )
);
