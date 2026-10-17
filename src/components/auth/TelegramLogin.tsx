'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Офіційний віджет Telegram Login.
 * Працює, коли задано NEXT_PUBLIC_TELEGRAM_BOT_USERNAME і в @BotFather
 * виконано /setdomain на домен сайту. Без цього блок просто не показується.
 */
export function TelegramLogin({ next }: { next: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  useEffect(() => {
    if (!bot || !box.current || box.current.childElementCount) return

    // Колбек, який викличе віджет після підтвердження в Telegram.
    ;(window as unknown as Record<string, unknown>).onTelegramAuth = async (
      user: Record<string, unknown>,
    ) => {
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ user, next }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Не вдалося увійти через Telegram')
        location.href = data.url ?? next
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', bot)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '12')
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    box.current.appendChild(script)
  }, [bot, next])

  if (!bot) return null

  return (
    <div className="mt-3">
      <div ref={box} className="flex justify-center [&_iframe]:!w-full" />
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
