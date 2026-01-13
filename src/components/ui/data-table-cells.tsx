import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"

interface ActionCellProps<T> {
  row: T
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
}

export function ActionCell<T>({ row, onEdit, onDelete }: ActionCellProps<T>) {
  return (
    <div className="flex justify-end space-x-2">
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
}

export function ExpandableListCell<T>({ 
  items, 
  renderItem, 
  limit = 2, 
  emptyMessage = "Sin datos" 
}: ExpandableListCellProps<T>) {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyMessage}</span>
  }

  return (
    <div className="space-y-2">
      {items.slice(0, limit).map((item, idx) => (
        <div key={idx}>{renderItem(item, idx)}</div>
      ))}
      {items.length > limit && (
        <Badge variant="outline">+{items.length - limit} más</Badge>
      )}
    </div>
  )
}
