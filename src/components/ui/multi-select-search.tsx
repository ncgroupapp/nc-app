import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
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
  hideTags?: boolean
  single?: boolean
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
  shouldFilter = true,
  hideTags = false,
  single
}: MultiSelectSearchProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string | number) => {
    onRemove(item)
  }

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between h-auto min-h-10 px-3 py-2 cursor-pointer hover:bg-transparent",
            className
          )}
          onClick={() => setOpen((prev) => !prev)}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedValues.length > 0 ? (
              single ? (
                <span className="truncate w-32">
                  {options.find((option) => option.id === selectedValues[0])?.label || selectedValues[0]}
                </span>
              ) : (
                selectedValues.map((val) => {
                  const option = options.find((o) => o.id === val)
                  return (
                    <Badge
                      key={val}
                      variant="secondary"
                      className="mr-1 mb-1 px-2 py-0.5 font-normal"
                    >
                      {option ? option.label : val}
                      <button
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUnselect(val)
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleUnselect(val)
                        }}
                      >
                        <X className="h-3 w-3 text-black hover:text-foreground" />
                      </button>
                    </Badge>
                  )
                })
              )
            ) : (
              <span className="text-black">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
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
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.id)
                return (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    onSelect={() => {
                      if (single) {
                        onSelect(option.id)
                        setOpen(false)
                      } else {
                        if (isSelected) {
                          onRemove(option.id)
                        } else {
                          onSelect(option.id)
                        }
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    </>
  )
}
