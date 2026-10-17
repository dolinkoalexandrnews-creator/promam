'use client'

import { SimpleMap } from '@/components/map/SimpleMap'
import type { Child, Profile } from '@/lib/types'

export function MapScreen({ profile }: { profile: Profile & { children: Child[] } }) {
  return <SimpleMap />
}
