'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableColumn } from '@/components/ui/data-table'
import { ActionCell } from '@/components/ui/data-table-cells'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useManualesStore } from '@/stores/manuales/manualesStore'
import { Manual, CreateManualForm } from '@/types'
import { BookOpen, Plus, Search } from 'lucide-react'
import { deleteManualPdf } from '@/lib/firebase'
import { useEffect, useRef, useState } from 'react'
import { ManualForm, ManualFormHandle } from '@/components/manuales/manual-form'
import { ManualFilesCell } from '@/components/manuales/manual-files-cell'
import { SearchInput } from '@/components/common/search-input'
import { useConfirm } from '@/hooks/use-confirm'
import { useDebounce } from '@/hooks/use-debounce'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/common/fade-in'

export default function ManualesPage() {
    const {
        manuales,
        isLoading,
        pagination,
        fetchManuales,
        createManual,
        updateManual,
        deleteManual,
        error
    } = useManualesStore()

    const { confirm } = useConfirm()
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 300)
    const [currentPage, setCurrentPage] = useState(1)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingManual, setEditingManual] = useState<Manual | null>(null)
    const formRef = useRef<ManualFormHandle>(null)

    useEffect(() => {
        fetchManuales(currentPage, debouncedSearch)
    }, [currentPage, debouncedSearch, fetchManuales])

    const handleFormSubmit = async (data: CreateManualForm) => {
        try {
            if (editingManual) {
                await updateManual(editingManual.id.toString(), data)
            } else {
                await createManual(data)
            }
            setIsCreateDialogOpen(false)
            setEditingManual(null)
        } catch (error) {
            console.error('Error saving manual:', error)
        }
    }

    const handleEdit = (manual: Manual) => {
        setEditingManual(manual)
        setIsCreateDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (await confirm({
            title: 'Eliminar Manual',
            message: '¿Está seguro que desea eliminar este manual?',
            variant: 'destructive'
        })) {
            try {
                // Find the manual to get its fileUrls before deleting
                const manual = manuales.find((m) => m.id.toString() === id)
                await deleteManual(id)
                // Delete all files from Firebase Storage after the record is removed
                if (manual?.fileUrls?.length) {
                    await Promise.allSettled(
                        manual.fileUrls.map(url =>
                            deleteManualPdf(url).catch(e =>
                                console.error('Error deleting file from Firebase:', e)
                            )
                        )
                    )
                }
            } catch (error) {
                console.error('Error deleting manual:', error)
            }
        }
    }

    const columns: DataTableColumn<Manual>[] = [
        {
            key: 'name',
            header: 'Nombre',
            accessorKey: 'name',
            className: 'font-medium',
        },
        {
            key: 'description',
            header: 'Descripción',
            render: (row) => row.description
                ? <span className="font-medium">{row.description}</span>
                : <span className="text-muted-foreground/50 italic text-xs">Sin descripción</span>,
        },
        {
            key: 'fileUrls',
            header: 'Archivos',
            render: (row) => <ManualFilesCell urls={row.fileUrls ?? []} />,
        },
        {
            key: 'created_at',
            header: 'Fecha de subida',
            render: (row) => new Date(row.createdAt).toLocaleDateString('es-UY', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }),
        },
        {
            key: 'updated_at',
            header: 'Última actualización',
            render: (row) => new Date(row.updatedAt).toLocaleDateString('es-UY', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }),
        },
        {
            key: 'actions',
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <ActionCell
                    row={row}
                    onEdit={handleEdit}
                    onDelete={(m) => handleDelete(m.id.toString())}
                />
            ),
        },
    ]

    const handleDialogChange = (open: boolean) => {
        if (!open) {
            // Route through the form's cancel so cleanup logic always runs
            formRef.current?.triggerCancel()
        } else {
            setIsCreateDialogOpen(true)
        }
    }

    return (
        <div className="space-y-6">
            <FadeIn direction="none">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manuales</h1>
                        <p className="text-muted-foreground">Gestión de manuales y documentos PDF.</p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingManual(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Manual
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[560px]">
                            <DialogHeader>
                                <DialogTitle>{editingManual ? 'Editar Manual' : 'Nuevo Manual'}</DialogTitle>
                                <DialogDescription>
                                    {editingManual
                                        ? 'Modifique los datos del manual.'
                                        : 'Complete la información para registrar un nuevo manual.'}
                                </DialogDescription>
                            </DialogHeader>
                            <ManualForm
                                ref={formRef}
                                initialData={editingManual}
                                onSubmit={handleFormSubmit}
                                onCancel={() => {
                                    setIsCreateDialogOpen(false)
                                    setTimeout(() => setEditingManual(null), 300)
                                }}
                                isLoading={isLoading}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </FadeIn>

            <FadeIn delay={100}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5" /> Filtros y Búsqueda
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <SearchInput
                                    placeholder="Buscar por nombre o descripción..."
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </FadeIn>

            <FadeIn delay={200}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BookOpen className="h-5 w-5" />
                            <span>Listado de Manuales</span>
                            <Badge variant="outline">{pagination.total} manuales</Badge>
                        </CardTitle>
                        <CardDescription>Gestione los manuales y documentos PDF del sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={manuales}
                            isLoading={isLoading}
                            pagination={{
                                page: pagination.page,
                                limit: pagination.limit,
                                total: pagination.total,
                                totalPages: pagination.lastPage,
                                onPageChange: setCurrentPage,
                            }}
                            emptyMessage={error ? error : 'No se encontraron manuales'}
                        />
                    </CardContent>
                </Card>
            </FadeIn>
        </div>
    )
}
