import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface AutocompleteOption {
  id: string | number
  label: string
  [key: string]: any
}

interface MultiSelectSearchProps {
  options: AutocompleteOption[]
  selectedValues: (string | number)[]
  onSelect: (value: string | number) => void
  onRemove: (value: string | number) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  shouldFilter?: boolean
}

export function MultiSelectSearch({
  options,
  selectedValues,
  onSelect,
  onRemove,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  className,
  searchValue,
  onSearchValueChange,
  shouldFilter = true
}: MultiSelectSearchProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("space-y-3", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={shouldFilter}>
            <CommandInput 
              placeholder={searchPlaceholder} 
              value={searchValue}
              onValueChange={onSearchValueChange}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    onSelect={() => {
                      if (!selectedValues.includes(option.id)) {
                        onSelect(option.id)
                      }
                      setOpen(false)
                    }}
                    disabled={selectedValues.includes(option.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(option.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {/* We try to find the label from options. If not found, show ID or fallback */}
          {selectedValues.map((val) => {
            const option = options.find(o => o.id === val);
            // If option is not in current list (e.g. filtered out), we might want to handle it.
            // But if the parent passes the full list of providers, it's fine.
            return (
              <Badge key={val} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                {option ? option.label : val}
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onRemove(val)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => onRemove(val)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
