"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
}

function formatTime(d: Date): string {
  return d.toTimeString().slice(0, 5) // Returns HH:MM
}

export function TimePicker({ date, setDate, className, placeholder = "Seleccionar hora" }: TimePickerProps) {
  const timeValue = date ? formatTime(date) : ""

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value
    if (!timeStr) {
      setDate(undefined)
      return
    }

    const newDate = date || new Date()
    const [hours, minutes] = timeStr.split(":").map(Number)
    newDate.setHours(hours || 0, minutes || 0, 0, 0)
    setDate(new Date(newDate))
  }

  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        className={cn("pl-10", className)}
        placeholder={placeholder}
      />
    </div>
  )
}
