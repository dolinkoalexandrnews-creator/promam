'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Empty, Spinner } from '@/components/ui/controls'
import { agoLabel } from '@/lib/format'

type ChatRow = {
  chat_id: string
  is_group: boolean
  pin_title: string | null
  other_id: string | null
  other_name: string
  other_photo: string | null
  last_body: string | null
  last_at: string | null
  unread: number
}

export function ChatsListScreen() {
  const sb = supabaseBrowser()
  const [rows, setRows] = useState<ChatRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: auth } = await sb.auth.getUser()
    if (!auth.user) return

    const { data: memberships, error: e } = await sb
      .from('chat_members')
      .select(
        'chat_id, last_read_at, chats(is_group, pins(title), direct_chats(user_a, user_b))',
      )
      .eq('user_id', auth.user.id)
    if (e) {
      setError(e.message)
      return
    }

    const list = (memberships ?? []) as unknown as Array<{
      chat_id: string
      last_read_at: string
      chats: {
        is_group: boolean
        pins: { title: string } | null
        direct_chats: { user_a: string; user_b: string }[] | null
      } | null
    }>

    const result: ChatRow[] = []

    for (const m of list) {
      if (!m.chats) continue

      // Пропускаємо чати кіл — вони живуть у «Колах», а не у стрічці чатів.
      const { data: circleCheck } = await sb
        .from('circles')
        .select('id')
        .eq('chat_id', m.chat_id)
        .maybeSingle()
      if (circleCheck) continue

      let otherId: string | null = null
      let otherName = m.chats.pins?.title ?? 'Компанія'
      let otherPhoto: string | null = null

      if (!m.chats.is_group && m.chats.direct_chats?.length) {
        const pair = m.chats.direct_chats[0]
        otherId = pair.user_a === auth.user.id ? pair.user_b : pair.user_a
        const { data: profile } = await sb
          .from('profiles')
          .select('display_name, photo_url')
          .eq('id', otherId)
          .single()
        otherName = profile?.display_name ?? 'Мама'
        otherPhoto = profile?.photo_url ?? null
      }

      const { data: last } = await sb
        .from('messages')
        .select('body, created_at')
        .eq('chat_id', m.chat_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count: unread } = await sb
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', m.chat_id)
        .neq('sender_id', auth.user.id)
        .gt('created_at', m.last_read_at)

      result.push({
        chat_id: m.chat_id,
        is_group: m.chats.is_group,
        pin_title: m.chats.pins?.title ?? null,
        other_id: otherId,
        other_name: otherName,
        other_photo: otherPhoto,
        last_body: last?.body ?? null,
        last_at: last?.created_at ?? null,
        unread: unread ?? 0,
      })
    }

    result.sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''))
    setRows(result)
  }, [sb])

  useEffect(() => {
    void load()
    const channel = sb
      .channel('chats-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () =>
        void load(),
      )
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }, [sb, load])

  if (error) return <p className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>

  if (!rows) {
    return (
      <div className="grid h-[60dvh] place-items-center">
        <Spinner className="h-6 w-6 text-rose-500" />
      </div>
    )
  }

  if (!rows.length) {
    return (
      <Empty
        emoji="💬"
        title="Поки немає чатів"
        text="Поставте мітку чи натисніть «Прийду» — чат з'явиться тут сам."
      />
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-5">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Чати</h1>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <Link
            key={r.chat_id}
            href={`/app/chats/${r.chat_id}`}
            className="flex items-center gap-3 rounded-2xl p-2.5 transition active:scale-[0.99] hover:bg-sand/50"
          >
            <Avatar src={r.other_photo} name={r.other_name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">
                  {r.is_group ? `👥 ${r.pin_title}` : r.other_name}
                </span>
                {r.last_at && (
                  <span className="shrink-0 text-xs text-muted">{agoLabel(r.last_at)}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-muted">
                  {r.last_body ?? 'Чат відкрито'}
                </span>
                {r.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {r.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
