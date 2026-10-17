'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SignUpModal } from './SignUpModal'

export function SignUpSection() {
  const [signUpOpen, setSignUpOpen] = useState(false)

  return (
    <>
      <SignUpModal open={signUpOpen} onClose={() => setSignUpOpen(false)} />

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setSignUpOpen(true)}
          className="rounded-full bg-rose-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30"
        >
          ✨ Приєднатися
        </button>
        <Link
          href="/app"
          className="rounded-full bg-rose-100 px-7 py-3.5 font-medium text-rose-700 transition hover:bg-rose-200"
        >
          🗺️ Подивитись Мапу
        </Link>
        <a
          href="#how"
          className="rounded-full border border-line px-7 py-3.5 font-medium transition hover:bg-sand"
        >
          Як це працює
        </a>
      </div>
    </>
  )
}
