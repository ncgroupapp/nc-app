export interface Manual {
    id: number
    name: string
    description?: string
    fileUrl: string
    createdAt: string
    updatedAt: string
}

export interface ManualResponse {
    success: boolean
    data: Manual
    message: string
}

export interface CreateManualForm {
    name: string
    description?: string
    fileUrl: string
}
