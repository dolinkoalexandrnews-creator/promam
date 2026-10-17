'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Message = {
  sender: string
  body: string
  at: string
}

type Chat = {
  id: string
  with_name: string
  messages: Message[]
}

export function ChatRoomScreen({ chatId }: { chatId: string }) {
  const router = useRouter()
  const [chat, setChat] = useState<Chat | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      setCurrentUser(JSON.parse(user).name)
    }
    const chats = localStorage.getItem('chats')
    if (chats) {
      const parsed = JSON.parse(chats) as Chat[]
      const found = parsed.find((c) => c.id === chatId)
      if (found) {
        setChat(found)
      }
    }
  }, [chatId])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [chat?.messages.length])

  function send() {
    if (!text.trim() || !chat) return

    setSending(true)
    const newMessage: Message = {
      sender: currentUser,
      body: text.trim(),
      at: new Date().toISOString(),
    }

    const updated = { ...chat, messages: [...chat.messages, newMessage] }
    setChat(updated)
    setText('')

    // Зберігаємо в localStorage
    const chats = JSON.parse(localStorage.getItem('chats') || '[]') as Chat[]
    const idx = chats.findIndex((c) => c.id === chatId)
    if (idx !== -1) {
      chats[idx] = updated
      localStorage.setItem('chats', JSON.stringify(chats))
    }

    setSending(false)
  }

  if (!chat) {
    return <div className="grid place-items-center h-[70dvh]">Завантаження...</div>
  }

  return (
    <div className="flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] flex-col">
      <div className="flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3">
        <button onClick={() => router.push('/app/chats')} className="text-xl text-muted">
          ‹
        </button>
        <div className="h-9 w-9 rounded-full bg-rose-200 flex items-center justify-center text-sm font-bold text-rose-700">
          {chat.with_name[0]}
        </div>
        <div className="flex-1 font-semibold">{chat.with_name}</div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {chat.messages.length === 0 ? (
          <div className="grid place-items-center h-full">
            <div className="text-center">
              <p className="text-2xl">👋</p>
              <p className="mt-2 text-sm text-muted">Напиши першою</p>
            </div>
          </div>
        ) : (
          chat.messages.map((m, i) => {
            const mine = m.sender === currentUser
            return (
              <div key={i} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[75%] flex flex-col ${mine ? 'items-end' : ''}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      mine ? 'bg-rose-500 text-white' : 'bg-white shadow-sm'
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 px-1 text-[10px] text-muted">
                    {new Date(m.at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottom} />
      </div>

      <div className="flex items-end gap-2 border-t border-line bg-white p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Написати…"
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-line bg-sand/40 px-4 py-2.5 text-sm outline-none focus:border-rose-300"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 rounded-2xl bg-rose-500 text-white font-medium disabled:opacity-50 transition"
        >
          ➤
        </button>
      </div>
    </div>
  )
}
