'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

const TABS = [
  { href: '/app', label: 'Мапа', icon: MapIcon, exact: true },
  { href: '/app/circles', label: 'Кола', icon: CirclesIcon },
  { href: '/app/chats', label: 'Чати', icon: ChatIcon, badge: true },
  { href: '/app/friends', label: 'Подруги', icon: FriendsIcon },
  { href: '/app/profile', label: 'Я', icon: ProfileIcon },
]

export function BottomNav() {
  const path = usePathname()
  const [unread, setUnread] = useState(0)

  // Лічильник непрочитаних — оновлюється наживо.
  useEffect(() => {
    const sb = supabaseBrowser()
    let active = true

    async function load() {
      const { data: auth } = await sb.auth.getUser()
      if (!auth.user) return

      const { data: memberships } = await sb
        .from('chat_members')
        .select('chat_id, last_read_at')
        .eq('user_id', auth.user.id)
      if (!memberships?.length || !active) return

      let total = 0
      for (const m of memberships) {
        const { count } = await sb
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', m.chat_id)
          .neq('sender_id', auth.user.id)
          .gt('created_at', m.last_read_at)
        total += count ?? 0
      }
      if (active) setUnread(total)
    }

    void load()
    const channel = sb
      .channel('nav-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () =>
        void load(),
      )
      .subscribe()

    return () => {
      active = false
      void sb.removeChannel(channel)
    }
  }, [])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[900] border-t border-line bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = tab.exact ? path === tab.href : path.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 transition active:scale-95"
            >
              <span className={active ? 'text-rose-500' : 'text-muted'}>
                <Icon filled={active} />
              </span>
              <span
                className={`text-[10px] font-medium ${active ? 'text-rose-500' : 'text-muted'}`}
              >
                {tab.label}
              </span>
              {tab.badge && unread > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-1.4rem)] grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

type IconProps = { filled?: boolean }
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function MapIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}

function CirclesIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <circle cx="9" cy="9" r="5" />
      <circle cx="15" cy="15" r="5" />
    </svg>
  )
}

function ChatIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 1 1 21 12Z" />
    </svg>
  )
}

function FriendsIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 14.6a5.5 5.5 0 0 1 3 5.4" />
    </svg>
  )
}

function ProfileIcon({ filled }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}
