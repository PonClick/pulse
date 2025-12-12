'use client'

import { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps): React.ReactElement | null {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl',
          'animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex-shrink-0 p-6 pb-0 mb-4 flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({
  children,
  className,
}: ModalFooterProps): React.ReactElement {
  return (
    <div className={cn('mt-6 flex justify-end gap-3', className)}>
      {children}
    </div>
  )
}
