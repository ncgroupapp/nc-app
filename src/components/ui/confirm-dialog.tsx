'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useConfirmStore } from '@/stores/ui/confirmStore'

export function ConfirmDialog() {
  const { isOpen, options, handleConfirm, handleCancel } = useConfirmStore()

  // Prevent closing by clicking outside or escape key if needed, or handle as cancel
  const handleOpenChange = (open: boolean) => {
    if (!open) handleCancel()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          <DialogDescription>
            {options.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {options.cancelText}
          </Button>
          <Button variant={options.variant} onClick={handleConfirm}>
            {options.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
