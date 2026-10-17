'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SignUpModal } from './SignUpModal'

export function AuthButtons() {
  const [signUpOpen, setSignUpOpen] = useState(false)

  return (
    <>
      <SignUpModal open={signUpOpen} onClose={() => setSignUpOpen(false)} />

      <div className="flex items-center gap-3">
        <Link
          href="/app"
          className="rounded-full bg-rose-100 text-rose-700 px-5 py-2 text-sm font-medium transition hover:bg-rose-200"
        >
          🗺️ Мапа
        </Link>
        <Link
          href="/login"
          className="rounded-full text-ink px-5 py-2 text-sm font-medium transition hover:text-rose-600"
        >
          Увійти
        </Link>
        <button
          onClick={() => setSignUpOpen(true)}
          className="rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-2 text-sm font-semibold shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 hover:shadow-xl transition-all"
        >
          ✨ Реєстрація
        </button>
      </div>
    </>
  )
}
