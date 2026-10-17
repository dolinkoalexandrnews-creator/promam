import { currentProfile } from '@/lib/supabase/server'
import { MapScreen } from '@/components/map/MapScreen'
import type { Child, Profile } from '@/lib/types'

export const metadata = { title: 'Мапа — PROMAM' }

export default async function MapPage() {
  const profile = (await currentProfile()) as (Profile & { children: Child[] }) | null
  return <MapScreen profile={profile!} />
}
