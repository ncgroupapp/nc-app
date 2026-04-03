"use client"

import { cn } from "@/lib/utils"
import React from "react"

interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  children: React.ReactNode
}

export function FadeIn({
  delay = 0,
  direction = "up",
  className,
  children,
  ...props
}: FadeInProps) {
  const directionClasses = {
    up: "animate-fade-in-up",
    down: "animate-fade-in-down",
    left: "animate-fade-in-left",
    right: "animate-fade-in-right",
    none: "animate-fade-in",
  }

  const animationClass = directionClasses[direction] || "animate-fade-in-up"

  return (
    <div
      className={cn(animationClass, className)}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
      {...props}
    >
      {children}
    </div>
  )
}
