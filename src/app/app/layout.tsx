import { redirect } from 'next/navigation'
import { currentProfile } from '@/lib/supabase/server'
import { BottomNav } from '@/components/shell/BottomNav'
import type { Child, Profile } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = (await currentProfile()) as (Profile & { children: Child[] }) | null

  if (!profile) redirect('/login')
  if (profile.is_banned) {
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
  if (!profile.onboarded_at) redirect('/onboarding')

  return (
    <div className="min-h-dvh bg-cream">
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </div>
  )
}
