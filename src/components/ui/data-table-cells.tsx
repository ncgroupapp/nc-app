import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ActionCellProps<T> {
  row: T
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
}

export function ActionCell<T>({ row, onEdit, onDelete, onView }: ActionCellProps<T>) {
  return (
    <div className="flex justify-end space-x-2">
      {onView && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onView(row)
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(row)
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(row)
          }}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

interface ExpandableListCellProps<T> {
  items?: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  limit?: number
  emptyMessage?: string
  label?: string
}

export function ExpandableListCell<T>({ 
  items, 
  renderItem, 
  limit = 2, 
  emptyMessage = "Sin datos",
  label = "Detalles"
}: ExpandableListCellProps<T>) {
  if (!items || items.length === 0) {
    return <span className="text-blue-950 text-sm">{emptyMessage}</span>
  }

  const visibleItems = items.slice(0, limit)
  const hiddenCount = items.length - limit

  return (
    <div className="space-y-1">
      {visibleItems.map((item, idx) => (
        <div key={idx}>{renderItem(item, idx)}</div>
      ))}
      
      {hiddenCount > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              +{hiddenCount} más
            </Badge>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="flex flex-col gap-3">
                {items.map((item, idx) => (
                  <div key={idx} className="border-b last:border-0 pb-2 last:pb-0">
                    {renderItem(item, idx)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
