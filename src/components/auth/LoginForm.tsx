'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { TelegramLogin } from '@/components/auth/TelegramLogin'

type Tab = 'email' | 'phone'

export function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/app'

  const [tab, setTab] = useState<Tab>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+380')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sb = supabaseBrowser()

  function fail(e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    setError(
      /provider is not enabled|not enabled/i.test(msg)
        ? 'Цей спосіб входу ще не увімкнений у налаштуваннях Supabase.'
        : msg,
    )
  }

  async function signInWithGoogle() {
    setBusy(true)
    setError(null)
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
    } catch (e) {
      fail(e)
      setBusy(false)
    }
  }

  async function sendEmailLink(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
      setNote(`Лист із посиланням полетів на ${email}. Відкрий його з цього ж телефона.`)
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  async function sendPhoneCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error } = await sb.auth.signInWithOtp({ phone })
      if (error) throw error
      setCodeSent(true)
      setNote(`Код надіслано на ${phone}`)
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }

  async function verifyPhoneCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error } = await sb.auth.verifyOtp({ phone, token: code, type: 'sms' })
      if (error) throw error
      location.href = next
    } catch (e) {
      fail(e)
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Вхід у PROMAM</h1>
      <p className="mt-1 text-sm text-muted">Обери зручний спосіб — акаунт буде один і той самий.</p>

      {/* Google */}
      <button
        onClick={signInWithGoogle}
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 font-medium transition hover:bg-sand disabled:opacity-50"
      >
        <GoogleMark />
        Увійти через Google
      </button>

      {/* Telegram */}
      <TelegramLogin next={next} />

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        або
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Пошта / телефон */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-sand p-1 text-sm">
        {(['email', 'phone'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setError(null)
              setNote(null)
            }}
            className={`rounded-lg py-2 font-medium transition ${
              tab === t ? 'bg-white shadow-sm' : 'text-muted'
            }`}
          >
            {t === 'email' ? 'Пошта' : 'Телефон'}
          </button>
        ))}
      </div>

      {tab === 'email' ? (
        <form onSubmit={sendEmailLink} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="мама@пошта.com"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-rose-300"
          />
          <button
            disabled={busy}
            className="w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {busy ? 'Надсилаю…' : 'Надіслати посилання'}
          </button>
        </form>
      ) : !codeSent ? (
        <form onSubmit={sendPhoneCode} className="space-y-3">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380XXXXXXXXX"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-rose-300"
          />
          <button
            disabled={busy}
            className="w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {busy ? 'Надсилаю…' : 'Надіслати код'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyPhoneCode} className="space-y-3">
          <input
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код з SMS"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-center tracking-[0.4em] outline-none focus:border-rose-300"
          />
          <button
            disabled={busy}
            className="w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {busy ? 'Перевіряю…' : 'Увійти'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCodeSent(false)
              setCode('')
              setNote(null)
            }}
            className="w-full text-sm text-muted underline"
          >
            Змінити номер
          </button>
        </form>
      )}

      {note && <p className="mt-4 rounded-xl bg-sage-100 px-4 py-3 text-sm text-sage-600">{note}</p>}
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.9z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7a14.5 14.5 0 010-9.4l-7.8-6.1a24 24 0 000 21.6l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.2-8.8 2.2-6.3 0-11.7-3.8-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  )
}
