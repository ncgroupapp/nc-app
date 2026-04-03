"use client";

import { ArrowLeft, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  icon?: LucideIcon;
  backButton?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  backButton = true,
  actions,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6", className)}>
      <div className="flex items-center gap-4">
        {backButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            aria-label="Volver"
            className="h-10 w-10 rounded-full shrink-0 border-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <div className="flex items-center gap-2 mt-1">
              {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />}
              <div className="text-muted-foreground font-medium truncate">
                {subtitle}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
