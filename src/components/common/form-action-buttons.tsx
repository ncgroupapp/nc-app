"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormActionButtonsProps {
  onCancel: () => void;
  isLoading?: boolean;
  submitText?: string;
  loadingText?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
}

export function FormActionButtons({
  onCancel,
  isLoading = false,
  submitText = "Guardar",
  loadingText = "Guardando...",
  className,
  variant = "default",
  disabled = false,
}: FormActionButtonsProps) {
  return (
    <DialogFooter className={cn("mt-6", className)}>
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        variant={variant}
        disabled={isLoading || disabled}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? loadingText : submitText}
      </Button>
    </DialogFooter>
  );
}
