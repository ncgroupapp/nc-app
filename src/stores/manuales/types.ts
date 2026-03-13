import { Manual, CreateManualForm } from '@/types/manual';
import { PaginationMeta } from '@/types/api';

export interface ManualesState {
    manuales: Manual[];
    selectedManual: Manual | null;
    isLoading: boolean;
    error: string | null;
    pagination: PaginationMeta;
    filters: {
        search: string;
    };
}

export interface ManualesActions {
    fetchManuales: (page?: number, search?: string) => Promise<void>;
    createManual: (data: CreateManualForm) => Promise<void>;
    updateManual: (id: string, data: Partial<CreateManualForm>) => Promise<void>;
    deleteManual: (id: string) => Promise<void>;
    setSelectedManual: (manual: Manual | null) => void;
    setFilters: (filters: Partial<ManualesState['filters']>) => void;
    setCurrentPage: (page: number) => void;
    resetError: () => void;
}

export type ManualesStore = ManualesState & ManualesActions;
