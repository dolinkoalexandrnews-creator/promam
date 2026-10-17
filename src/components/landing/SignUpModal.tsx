'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SignUpModalProps {
  open: boolean
  onClose: () => void
}

export function SignUpModal({ open, onClose }: SignUpModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Валідація
      if (!email || !password || !name) {
        throw new Error('Заповни всі поля')
      }
      if (password.length < 6) {
        throw new Error('Пароль повинен бути не менше 6 символів')
      }

      // Зберігаємо користувача локально (потім буде Supabase)
      const user = {
        id: Date.now().toString(),
        email,
        name: name.trim(),
        created_at: new Date().toISOString(),
        location: null,
      }

      localStorage.setItem('currentUser', JSON.stringify(user))
      localStorage.setItem('userEmail', email)

      setSuccess(true)
      setTimeout(() => {
        router.push('/app')
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка реєстрації')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setName('')
    setSuccess(false)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 text-2xl text-muted hover:text-ink transition"
        >
          ✕
        </button>

        {!success ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-ink">
                Приєднайся! 💚
              </h2>
              <p className="mt-2 text-sm text-muted">
                Реєстрація займе 30 секунд
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-2">Твоє ім'я</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Марія"
                  required
                  autoFocus
                  className="w-full rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mariya@example.com"
                  required
                  className="w-full rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-2">Пароль (мін. 6 символів)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border-2 border-rose-200 px-4 py-3 font-bold transition hover:bg-rose-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim() || !name.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 font-bold text-white transition hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? '⏳ Реєстрація...' : '✨ Приєднатися'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <p className="mt-4 text-center text-xs text-muted">
              🔒 Твої дані в безпеці. Мам з однією мамою максимум.
            </p>
          </>
        ) : (
          <>
            {/* Success Message */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 to-pink-200">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Ласкаво просимо, {name}! 💚</h3>
              <p className="text-sm text-muted">
                Переходимо на карту...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
