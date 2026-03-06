"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface DetailItemProps {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function DetailItem({
  icon: Icon,
  label,
  value,
  className,
  iconClassName,
  labelClassName,
  valueClassName,
}: DetailItemProps) {
  if (!value) return null;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {Icon && (
        <Icon 
          className={cn("h-4 w-4 text-muted-foreground mt-0.5 shrink-0", iconClassName)} 
          aria-hidden="true" 
        />
      )}
      <div className="flex flex-col min-w-0">
        <span className={cn("text-xs text-muted-foreground uppercase font-semibold tracking-wider", labelClassName)}>
          {label}
        </span>
        <div className={cn("text-sm font-medium break-words", valueClassName)}>
          {value}
        </div>
      </div>
    </div>
  );
}

interface DetailCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DetailCard({
  title,
  children,
  className,
  contentClassName,
}: DetailCardProps) {
  return (
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b bg-muted/30">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("p-5 space-y-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
