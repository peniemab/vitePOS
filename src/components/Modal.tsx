import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Icône Material Symbols à gauche du titre */
  icon?: string
  /** Classes supplémentaires sur le panneau */
  className?: string
}

export function Modal({ open, title, onClose, children, footer, icon, className = '' }: Props) {
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) {
      wasOpen.current = false
      return
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)

    if (!wasOpen.current) {
      wasOpen.current = true
      requestAnimationFrame(() => {
        const el = bodyRef.current?.querySelector<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
        )
        el?.focus()
      })
    }

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] bg-on-background/20 flex items-end md:items-center justify-center p-0 md:p-gutter backdrop-blur-sm"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer"
        onClick={() => onCloseRef.current()}
      />
      <div
        className={`relative bg-surface w-full md:max-w-2xl md:rounded-xl shadow-lg border border-outline-variant flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] animate-modal-slide-up ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between px-gutter py-4 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className="material-symbols-outlined text-on-surface-variant text-2xl shrink-0">
                {icon}
              </span>
            )}
            <h2 id={titleId} className="font-headline-md text-headline-md text-on-surface truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="h-touch-target-min w-touch-target-min flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:bg-surface-variant shrink-0"
            onClick={() => onCloseRef.current()}
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>

        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto p-gutter space-y-stack-md bg-surface-container-low"
        >
          {children}
        </div>

        {footer && (
          <div className="p-gutter bg-surface border-t border-outline-variant shrink-0 pb-[max(env(safe-area-inset-bottom),16px)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
