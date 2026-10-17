import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Вхід — PROMAM' }

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold tracking-tight">
          PRO<span className="text-rose-500">MAM</span>
        </Link>
        <p className="mt-2 text-center text-sm text-muted">Мами знаходять мам</p>

        <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-sand" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          Входячи, ти погоджуєшся з правилами спільноти: справжнє фото, повага до інших мам і
          жодної реклами.
        </p>
      </div>
    </main>
  )
}
