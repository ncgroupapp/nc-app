"use client";

import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchPickerProps<T> {
  /** Button content. */
  trigger: ReactNode;
  placeholder: string;
  search: (term: string) => Promise<T[]>;
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  variant?: "outline" | "secondary" | "default";
  className?: string;
}

/** Button that opens a server-side search list; picking an item closes it. */
export function SearchPicker<T>({
  trigger,
  placeholder,
  search,
  getKey,
  renderItem,
  onSelect,
  variant = "outline",
  className,
}: SearchPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(term, 300);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    search(debounced.trim())
      .then((result) => !cancelled && setItems(result))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // search is recreated by the parent on each render; the term and open state drive reloads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant={variant} className={className}>
          {trigger}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={term} onValueChange={setTerm} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>Sin resultados</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={getKey(item)}
                      value={String(getKey(item))}
                      onSelect={() => {
                        onSelect(item);
                        setOpen(false);
                        setTerm("");
                      }}
                    >
                      {renderItem(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
