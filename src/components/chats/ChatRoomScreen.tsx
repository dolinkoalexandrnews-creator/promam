'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button, Empty, Spinner } from '@/components/ui/controls'
import { ReportDialog } from '@/components/safety/ReportDialog'
import { PhotoPicker } from '@/components/profile/PhotoPicker'
import { agoLabel } from '@/lib/format'
import type { Message } from '@/lib/types'

type HeaderInfo = { title: string; photo: string | null; otherId: string | null }

export function ChatRoomScreen({ chatId }: { chatId: string }) {
  const sb = supabaseBrowser()
  const router = useRouter()

  const [myId, setMyId] = useState<string | null>(null)
  const [header, setHeader] = useState<HeaderInfo | null>(null)
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [reportingUser, setReportingUser] = useState<string | null>(null)
  const [reportingMsg, setReportingMsg] = useState<string | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    const { data } = await sb
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(500)
    setMessages((data ?? []) as Message[])
  }, [sb, chatId])

  useEffect(() => {
    void (async () => {
      const { data: auth } = await sb.auth.getUser()
      if (!auth.user) return
      setMyId(auth.user.id)

      // Позначаємо прочитаним
      await sb
        .from('chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', auth.user.id)

      const { data: chat } = await sb
        .from('chats')
        .select('is_group, pins(title), direct_chats(user_a, user_b)')
        .eq('id', chatId)
        .single()

      if (chat?.is_group) {
        setHeader({ title: chat.pins?.[0]?.title ?? 'Компанія', photo: null, otherId: null })
      } else {
        const pair = chat?.direct_chats?.[0] as
          | { user_a: string; user_b: string }
          | undefined
        const otherId = pair ? (pair.user_a === auth.user.id ? pair.user_b : pair.user_a) : null
        if (otherId) {
          const { data: profile } = await sb
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', otherId)
            .single()
          setHeader({
            title: profile?.display_name ?? 'Мама',
            photo: profile?.photo_url ?? null,
            otherId,
          })
        }
      }

      void loadMessages()
    })()
  }, [sb, chatId, loadMessages])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length])

  useEffect(() => {
    const channel = sb
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        () => void loadMessages(),
      )
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }, [sb, chatId, loadMessages])

  async function send() {
    if (!text.trim() || !myId) return
    setSending(true)
    const { error } = await sb
      .from('messages')
      .insert({ chat_id: chatId, sender_id: myId, body: text.trim() })
    if (!error) setText('')
    setSending(false)
  }

  async function sendPhoto(url: string) {
    if (!myId) return
    await sb.from('messages').insert({ chat_id: chatId, sender_id: myId, photo_url: url })
  }

  if (!header || !messages) {
    return (
      <div className="grid h-[70dvh] place-items-center">
        <Spinner className="h-6 w-6 text-rose-500" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] flex-col">
      <div className="flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur">
        <button onClick={() => router.push('/app/chats')} className="text-xl text-muted">
          ‹
        </button>
        {header.otherId ? (
          <Avatar src={header.photo} name={header.title} size="sm" />
        ) : (
          <span className="text-xl">👥</span>
        )}
        <div className="flex-1 truncate font-semibold">{header.title}</div>
        {header.otherId && (
          <button
            onClick={() => setReportingUser(header.otherId)}
            className="text-xs text-muted underline"
          >
            Скарга
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <Empty emoji="👋" title="Напиши першою" />
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === myId
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}
                onDoubleClick={() => !mine && setReportingMsg(m.id)}
              >
                <div className={`max-w-[75%] ${mine ? 'items-end' : ''} flex flex-col`}>
                  {m.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photo_url}
                      alt=""
                      className="max-h-72 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        mine ? 'bg-rose-500 text-white' : 'bg-white shadow-sm'
                      }`}
                    >
                      {m.body}
                    </div>
                  )}
                  <span className="mt-0.5 px-1 text-[10px] text-muted">
                    {agoLabel(m.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottom} />
      </div>

      <div className="flex items-end gap-2 border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {myId && <PhotoPicker userId={myId} onUploaded={sendPhoto} label="📷" />}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Написати…"
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-line bg-sand/40 px-4 py-2.5 text-sm outline-none focus:border-rose-300"
        />
        <Button size="md" loading={sending} disabled={!text.trim()} onClick={send}>
          ➤
        </Button>
      </div>

      {reportingUser && (
        <ReportDialog targetUserId={reportingUser} onClose={() => setReportingUser(null)} />
      )}
      {reportingMsg && (
        <ReportDialog messageId={reportingMsg} onClose={() => setReportingMsg(null)} />
      )}
    </div>
  )
}
