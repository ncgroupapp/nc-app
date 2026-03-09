import api from '@/lib/axios';
import { Manual, CreateManualForm, ManualResponse } from '@/types/manual';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export interface ManualFilters {
    page?: number;
    limit?: number;
    search?: string;
}

const BASE_URL = '/manuals';

export const manualesService = {
    getAll: async (
        filters: ManualFilters = {}
    ): Promise<PaginatedResponse<Manual>> => {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);

        const response = await api.get<PaginatedResponse<Manual>>(
            `${BASE_URL}?${params.toString()}`
        );
        return response.data;
    },

    getById: async (id: string): Promise<ManualResponse> => {
        const response = await api.get<ApiResponse<Manual>>(
            `${BASE_URL}/${id}`
        );
        return response.data;
    },

    create: async (data: CreateManualForm): Promise<ManualResponse> => {
        const response = await api.post<ApiResponse<Manual>>(
            BASE_URL,
            data
        );
        return response.data;
    },

    update: async (
        id: string,
        data: Partial<CreateManualForm>
    ): Promise<ManualResponse> => {
        const response = await api.patch<ApiResponse<Manual>>(
            `${BASE_URL}/${id}`,
            data
        );
        return response.data;
    },

    delete: async (id: string): Promise<ManualResponse> => {
        const response = await api.delete<ManualResponse>(
            `${BASE_URL}/${id}`
        );
        return response.data;
    },
};
