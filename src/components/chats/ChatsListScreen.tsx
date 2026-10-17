'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Chat = {
  id: string
  with_name: string
  messages: Array<{ sender: string; body: string; at: string }>
}

export function ChatsListScreen() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentUser, setCurrentUser] = useState<string>('')
  const [newChatName, setNewChatName] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      setCurrentUser(JSON.parse(user).name)
      const stored = localStorage.getItem('chats')
      if (stored) {
        setChats(JSON.parse(stored))
      }
    }
  }, [])

  function startChat() {
    if (!newChatName.trim()) return

    const newChat: Chat = {
      id: Date.now().toString(),
      with_name: newChatName.trim(),
      messages: [],
    }

    const updated = [...chats, newChat]
    setChats(updated)
    localStorage.setItem('chats', JSON.stringify(updated))
    setNewChatName('')
    setShowForm(false)
  }

  if (!chats.length) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-5">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Чати</h1>
        {showForm ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-4 space-y-3">
            <p className="text-sm font-medium">З ким хочеш писати?</p>
            <input
              type="text"
              placeholder="Ім'я подруги"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') startChat()
              }}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-rose-300"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={startChat}
                className="flex-1 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white"
              >
                Розпочати чат
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium"
              >
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm text-rose-900">💬 Поки немає чатів</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-block px-6 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium"
            >
              + Розпочати чат
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Чати</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1 bg-rose-500 text-white text-sm rounded-lg font-medium"
        >
          +
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-rose-200 bg-white p-4 space-y-3 mb-4">
          <p className="text-sm font-medium">З ким хочеш писати?</p>
          <input
            type="text"
            placeholder="Ім'я подруги"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') startChat()
            }}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-rose-300"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={startChat}
              className="flex-1 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white"
            >
              Розпочати
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {chats.map((chat) => {
          const lastMsg = chat.messages[chat.messages.length - 1]
          return (
            <Link
              key={chat.id}
              href={`/app/chats/${chat.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:bg-sand/50"
            >
              <div className="h-10 w-10 rounded-full bg-rose-200 flex items-center justify-center text-sm font-bold text-rose-700">
                {chat.with_name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-text">{chat.with_name}</div>
                <div className="text-xs text-muted truncate">
                  {lastMsg?.body ?? 'Чат відкрито'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )

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
