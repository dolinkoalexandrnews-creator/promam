'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SignUpModalProps {
  open: boolean
  onClose: () => void
}

export function SignUpModal({ open, onClose }: SignUpModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Зв'язок з Supabase
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1000)
  }

  const handleClose = () => {
    setName('')
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl" style={{ margin: 'auto' }}>
        {/* Закрити */}
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 text-muted transition hover:text-ink text-xl"
        >
          ✕
        </button>

        {!success ? (
          <>
            {/* Заголовок */}
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-ink">
                Приєднайся до
                <span className="ml-2 text-rose-500">PROMAM</span>
              </h2>
            </div>
            <p className="mb-8 text-sm text-muted">
              Знайди мам поруч за одну хвилину. Спілкування, зустрічі, подруги 💚
            </p>

            {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ім'я */}
              <div>
                <label className="block text-xs font-medium text-ink">Як тебе звати?</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Марія"
                  required
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Кнопки */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-line px-4 py-3 font-medium transition hover:bg-sand"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
                >
                  {loading ? '⏳ Секунду...' : 'Входу!'}
                </button>
              </div>
            </form>

            {/* Social Login */}
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-3 text-center text-xs font-medium text-muted uppercase tracking-wide">Способи входу</p>
              <div className="space-y-2">
                <button className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:bg-blue-50 flex items-center justify-center gap-2">
                  🔵 <span>Google</span>
                </button>
                <button className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:bg-blue-50 flex items-center justify-center gap-2">
                  📱 <span>Telegram</span>
                </button>
                <button className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:bg-blue-50 flex items-center justify-center gap-2">
                  📧 <span>Email</span>
                </button>
                <button className="w-full rounded-xl border-2 border-rose-500 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-medium transition hover:bg-rose-100 flex items-center justify-center gap-2">
                  ✨ <span>Створити Аккаунт</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Успіх */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-pink-200">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-ink">Ласкаво просимо, {name}!</h3>
              <p className="mt-2 text-sm text-muted">
                Тепер можеш подивитись мам поруч на Мапі 🗺️
              </p>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => router.push('/app')}
                  className="w-full rounded-xl bg-rose-500 px-4 py-3 font-medium text-white transition hover:bg-rose-600"
                >
                  До Мами! 💚
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
