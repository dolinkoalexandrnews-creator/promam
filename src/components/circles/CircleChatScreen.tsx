'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button, Empty, Spinner } from '@/components/ui/controls'
import { ReportDialog } from '@/components/safety/ReportDialog'
import { agoLabel } from '@/lib/format'
import type { Circle, CircleMessage } from '@/lib/types'

export function CircleChatScreen({ slug }: { slug: string }) {
  const sb = supabaseBrowser()
  const router = useRouter()

  const [circle, setCircle] = useState<Circle | null>(null)
  const [messages, setMessages] = useState<CircleMessage[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportingMsg, setReportingMsg] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const { data: all } = await sb.rpc('list_circles')
    const found = (all ?? []).find((c: Circle) => c.slug === slug) ?? null
    setCircle(found)

    if (found?.is_member) {
      const { data, error: e } = await sb.rpc('circle_messages', { c_id: found.id })
      if (e) setError(e.message)
      else setMessages(((data ?? []) as CircleMessage[]).slice().reverse())
    }
  }, [sb, slug])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length])

  // Живий чат
  useEffect(() => {
    if (!circle?.chat_id) return
    const channel = sb
      .channel(`circle-${circle.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${circle.chat_id}` },
        () => void load(),
      )
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }, [sb, circle?.chat_id, circle?.id, load])

  async function send() {
    if (!circle || !text.trim()) return
    setSending(true)
    setError(null)
    const { error: e } = await sb.rpc('send_circle_message', {
      c_id: circle.id,
      text_body: text.trim(),
    })
    if (e) setError(e.message)
    else setText('')
    setSending(false)
    void load()
  }

  async function leave() {
    if (!circle) return
    setLeaving(true)
    await sb.rpc('leave_circle', { c_id: circle.id })
    router.push('/app/circles')
  }

  if (!circle) {
    return (
      <div className="grid h-[70dvh] place-items-center">
        <Spinner className="h-6 w-6 text-rose-500" />
      </div>
    )
  }

  if (!circle.is_member) {
    return (
      <Empty
        emoji={circle.emoji}
        title={circle.title}
        text="Ти ще не приєдналась до цього кола."
        action={<Button onClick={() => router.push('/app/circles')}>До списку кіл</Button>}
      />
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] flex-col">
      {/* Шапка */}
      <div className="flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur">
        <button onClick={() => router.push('/app/circles')} className="text-xl text-muted">
          ‹
        </button>
        <span className="text-xl">{circle.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{circle.title}</div>
          <div className="truncate text-xs text-muted">
            {circle.i_am_anonymous ? '🕶️ Ти пишеш анонімно' : 'Ти пишеш під своїм ім’ям'}
          </div>
        </div>
        <button onClick={leave} disabled={leaving} className="text-xs text-muted underline">
          Вийти
        </button>
      </div>

      {circle.is_sensitive && (
        <div className="bg-rose-50 px-4 py-2 text-center text-[11px] text-rose-700">
          Приватне коло · без осуду · {circle.i_am_anonymous ? 'твоя особа прихована' : ''}
        </div>
      )}

      {/* Повідомлення */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages === null ? (
          <div className="grid h-full place-items-center">
            <Spinner className="h-5 w-5 text-rose-500" />
          </div>
        ) : messages.length === 0 ? (
          <Empty
            emoji="💬"
            title="Тут поки тихо"
            text="Напиши першою — у цьому колі точно знайдуться ті, хто розуміє."
          />
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.is_mine ? 'flex-row-reverse' : ''}`}
              onDoubleClick={() => !m.is_mine && setReportingMsg(m.id)}
            >
              {!m.is_mine && <Avatar src={m.author_photo} name={m.author_name} size="xs" />}
              <div className={`max-w-[75%] ${m.is_mine ? 'items-end' : ''} flex flex-col`}>
                {!m.is_mine && (
                  <span className="mb-0.5 px-1 text-[11px] font-medium text-muted">
                    {m.author_name}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.is_mine ? 'bg-rose-500 text-white' : 'bg-white shadow-sm'
                  }`}
                >
                  {m.body}
                </div>
                <span className="mt-0.5 px-1 text-[10px] text-muted">
                  {agoLabel(m.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottom} />
      </div>

      {error && <p className="mx-4 mb-2 rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</p>}

      {/* Введення */}
      <div className="flex items-end gap-2 border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder={circle.i_am_anonymous ? 'Написати анонімно…' : 'Написати…'}
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-line bg-sand/40 px-4 py-2.5 text-sm outline-none focus:border-rose-300"
        />
        <Button size="md" loading={sending} disabled={!text.trim()} onClick={send}>
          ➤
        </Button>
      </div>

      {reportingMsg && (
        <ReportDialog messageId={reportingMsg} onClose={() => setReportingMsg(null)} />
      )}
    </div>
  )
}
