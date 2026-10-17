import { redirect } from 'next/navigation'
import { currentProfile } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import type { Child, Profile } from '@/lib/types'

export const metadata = { title: 'Знайомство — PROMAM' }

export default async function OnboardingPage() {
  const profile = (await currentProfile()) as (Profile & { children: Child[] }) | null
  if (!profile) redirect('/login')

  return (
    <main className="min-h-dvh bg-cream">
      <OnboardingWizard profile={profile} />
    </main>
  )
}
