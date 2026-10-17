'use client'

import { useEffect } from 'react'

/**
 * Нижня шторка — основний спосіб показувати деталі на мобільному.
 * Закривається свайпом вниз по «ручці», тапом по фону або Esc.
 */
export function Sheet({
  open,
  onClose,
  children,
  title,
  maxHeight = '88dvh',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  maxHeight?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fade-up relative w-full max-w-lg rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        style={{ maxHeight }}
      >
        <button
          onClick={onClose}
          aria-label="Закрити"
          className="mx-auto block w-full pt-3 pb-1 sm:hidden"
        >
          <span className="mx-auto block h-1.5 w-10 rounded-full bg-line" />
        </button>

        {title && (
          <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:pt-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Закрити"
              className="hidden h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-sand sm:grid"
            >
              ✕
            </button>
          </div>
        )}

        <div
          className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          style={{ maxHeight: `calc(${maxHeight} - 4rem)` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
