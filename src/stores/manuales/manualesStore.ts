import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ManualesStore } from './types';
import { manualesService } from '@/services/manuales.service';
import { PaginationMeta } from '@/types/api';

const getErrorMessage = (error: unknown): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const useManualesStore = create<ManualesStore>()(
    devtools(
        immer((set) => ({
            // Initial State
            manuales: [],
            selectedManual: null,
            isLoading: false,
            error: null,
            pagination: DEFAULT_PAGINATION,
            filters: {
                search: '',
            },

            // Actions
            fetchManuales: async (page = 1, search?: string) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });
                try {
                    const response = await manualesService.getAll({ page, search });
                    set((state) => {
                        if (response.success && response.data && response.meta) {
                            state.manuales = response.data;
                            state.pagination = response.meta;
                            state.isLoading = false;
                        } else {
                            state.error = 'Formato de respuesta inválido';
                            state.isLoading = false;
                        }
                    });
                } catch (error) {
                    console.error('fetchManuales error:', error);
                    set((state) => {
                        state.error = getErrorMessage(error);
                        state.isLoading = false;
                    });
                }
            },

            createManual: async (data) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });
                try {
                    const response = await manualesService.create(data);
                    if (response.success) {
                        set((state) => {
                            state.manuales.push(response.data);
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

            updateManual: async (id, data) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });
                try {
                    const response = await manualesService.update(id, data);
                    if (response.success) {
                        set((state) => {
                            const index = state.manuales.findIndex((m) => m.id.toString() === id);
                            if (index !== -1) {
                                state.manuales[index] = response.data;
                            }
                            if (state.selectedManual?.id.toString() === id) {
                                state.selectedManual = response.data;
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

            deleteManual: async (id) => {
                set((state) => {
                    state.isLoading = true;
                    state.error = null;
                });
                try {
                    const response = await manualesService.delete(id);
                    if (response.success) {
                        set((state) => {
                            state.manuales = state.manuales.filter((m) => m.id.toString() !== id);
                            if (state.selectedManual?.id.toString() === id) {
                                state.selectedManual = null;
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

            setSelectedManual: (manual) => {
                set((state) => {
                    state.selectedManual = manual;
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
