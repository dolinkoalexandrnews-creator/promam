import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types'

/** Supabase на сервері: читає сесію з кук користувачки. */
export async function supabaseServer() {
  const store = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options))
          } catch {
            // У Server Component куки лише читаються — оновить їх middleware.
          }
        },
      },
    },
  )
}

/**
 * Клієнт із правами сервісу — обходить RLS.
 * Використовувати ЛИШЕ в route handlers і cron. Ніколи в браузері.
 */
export function supabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/** Поточна користувачка або null. */
export async function currentUser() {
  const sb = await supabaseServer()
  const { data } = await sb.auth.getUser()
  return data.user ?? null
}

/** Профіль поточної користувачки разом з дітьми. */
export async function currentProfile() {
  const sb = await supabaseServer()
  const { data: auth } = await sb.auth.getUser()
  if (!auth.user) return null

  const { data } = await sb
    .from('profiles')
    .select('*, children(*)')
    .eq('id', auth.user.id)
    .single()

  return data ?? null
}
