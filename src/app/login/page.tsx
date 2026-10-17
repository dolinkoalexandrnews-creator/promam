'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui/controls'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 500))

    // Зберігаємо користувача в localStorage
    const user = { name: name.trim(), email: `${name.replace(/\s+/g, '').toLowerCase()}@promam.ua` }
    localStorage.setItem('currentUser', JSON.stringify(user))

    setLoading(false)
    router.push('/app')
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-br from-rose-50 to-orange-50 px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <h1 className="text-4xl font-bold">
            PRO<span className="text-rose-500">MAM</span>
          </h1>
          <p className="mt-2 text-sm text-muted">Мами поруч 👩‍👧‍👦</p>
        </Link>

        <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-center mb-6 text-text">Привіт! 👋</h2>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Input
                placeholder="Твоє ім'я"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <p className="mt-2 text-xs text-muted">Напиши своє ім'я і ми готові!</p>
            </div>

            <Button loading={loading} className="w-full">
              Почати 🚀
            </Button>
          </form>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 text-center">
            Просто введи ім'я — без паролів, без складностей
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Справжнє фото • Повага • Без реклами
        </p>
      </div>
    </main>
  )
}
