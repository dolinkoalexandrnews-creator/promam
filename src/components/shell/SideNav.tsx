'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

const TABS = [
  { href: '/app', label: 'Мапа', icon: MapIcon, exact: true },
  { href: '/app/plan', label: 'Прогулянки', icon: PlanIcon },
  { href: '/app/circles', label: 'Кола', icon: CirclesIcon },
  { href: '/app/tools', label: 'Інструменти', icon: ToolsIcon },
  { href: '/app/chats', label: 'Чати', icon: ChatIcon, badge: true },
  { href: '/app/friends', label: 'Подруги', icon: FriendsIcon },
  { href: '/app/profile', label: 'Я', icon: ProfileIcon },
]

export function SideNav() {
  const path = usePathname()
  const [unread, setUnread] = useState(0)

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
    <nav className="fixed inset-y-0 right-0 z-[900] flex w-20 flex-col border-l border-line bg-white/90 backdrop-blur-xl">
      <div className="flex flex-1 flex-col items-center gap-2 py-4">
        {TABS.map((tab) => {
          const active = tab.exact ? path === tab.href : path.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-lg transition active:scale-95"
              title={tab.label}
            >
              <span
                className={`transition ${active ? 'text-rose-500' : 'text-muted hover:text-text'}`}
              >
                <Icon filled={active} />
              </span>
              <span
                className={`text-[8px] font-bold leading-none ${active ? 'text-rose-500' : 'text-muted'}`}
              >
                {tab.label.slice(0, 3)}
              </span>
              {tab.badge && unread > 0 && (
                <span className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
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
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}

function CirclesIcon({ filled }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <circle cx="9" cy="9" r="5" />
      <circle cx="15" cy="15" r="5" />
    </svg>
  )
}

function ChatIcon({ filled }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 1 1 21 12Z" />
    </svg>
  )
}

function FriendsIcon({ filled }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 14.6a5.5 5.5 0 0 1 3 5.4" />
    </svg>
  )
}

function ProfileIcon({ filled }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function SchoolIcon({ filled }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <path d="M12 2 4 6v4h16V6l-8-4Z" />
      <rect x="5" y="10" width="14" height="10" rx="1" />
      <path d="M9 14h2v4H9M13 14h2v4h-2M8 10v-2M16 10v-2" />
    </svg>
  )
}

function ToolsIcon({ filled }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <path d="M9 3a1 1 0 0 1 1.707-.707l2.414 2.414a1 1 0 0 1 0 1.414L7.121 11.532a1 1 0 0 1-1.414 0L3.293 9.121a1 1 0 0 1 0-1.414l2.414-2.414A1 1 0 0 1 9 3Z" />
      <path d="m21 3-8.485 8.485" />
      <path d="m3 21 8.485-8.485" />
    </svg>
  )
}

function PlanIcon({ filled }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={filled ? 2.2 : 1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M7 14h2M7 18h2M13 14h2M13 18h2M19 14h2M19 18h2" />
    </svg>
  )
}
