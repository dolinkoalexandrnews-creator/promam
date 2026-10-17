'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

/** Supabase у браузері. Створюється один раз і перевикористовується. */
let cached: ReturnType<typeof createBrowserClient<Database>> | null = null

export function supabaseBrowser() {
  cached ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return cached
}
