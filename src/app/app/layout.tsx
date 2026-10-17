import { redirect } from 'next/navigation'
import { currentProfile } from '@/lib/supabase/server'
import { SideNav } from '@/components/shell/SideNav'
import type { Child, Profile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = (await currentProfile()) as (Profile & { children: Child[] }) | null

  // Демо режим: дозволити вхід без авторизації
  // if (!profile) redirect('/login')
  if (profile?.is_banned) {
    return (
      <main className="grid min-h-dvh place-items-center bg-cream px-6 text-center">
        <div>
          <div className="text-4xl">🚫</div>
          <h1 className="mt-4 text-xl font-semibold">Акаунт заблоковано</h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {profile.ban_reason ?? 'Правила спільноти було порушено.'} Якщо вважаєш це помилкою,
            напиши нам: support@promam.app
          </p>
        </div>
      </main>
    )
  }
  if (profile && !profile.onboarded_at) redirect('/onboarding')

  return (
    <div className="min-h-dvh bg-cream">
      {/* Хедер з кнопками входу */}
      <header className="sticky top-0 z-40 border-b border-line/30 bg-gradient-to-r from-white via-white to-rose-50/20 backdrop-blur-xl px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <a href="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition">
            PRO<span className="text-rose-500">MAM</span>
          </a>

          <div className="flex items-center gap-3">
            {profile ? (
              <>
                <span className="text-sm font-medium text-muted">👋 {profile.display_name}</span>
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center text-lg hover:shadow-md transition cursor-pointer">
                  👤
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-sm font-medium text-ink hover:text-rose-600 transition px-3 py-1.5"
                >
                  Увійти
                </a>
                <a
                  href="/"
                  className="text-sm font-semibold bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-full px-5 py-1.5 shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 hover:shadow-xl transition-all"
                >
                  ✨ Реєстрація
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="pr-20">{children}</div>
      <SideNav />
    </div>
  )
}
