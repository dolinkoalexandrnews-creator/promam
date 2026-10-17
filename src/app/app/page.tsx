'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AppPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'discover' | 'chats' | 'friends' | 'profile'>('discover')
  const [selectedMom, setSelectedMom] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [moms, setMoms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) setCurrentUser(JSON.parse(user))
    else setCurrentUser({ id: '1', name: 'Марія', email: 'maria@promam.ua' })
    loadMoms()
  }, [])

  const loadMoms = async () => {
    const { data, error } = await supabase
      .from('mom_profiles')
      .select('*, users(id, name, email)')

    if (!error && data) {
      setMoms(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!currentUser || !selectedMom) return
    loadMessages()
    subscribeToMessages()
  }, [selectedMom, currentUser])

  const loadMessages = async () => {
    const mom = moms.find(m => m.user_id === selectedMom)
    if (!mom) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser?.id},recipient_id.eq.${mom.user_id}),and(sender_id.eq.${mom.user_id},recipient_id.eq.${currentUser?.id})`)
      .order('created_at', { ascending: true })

    if (!error && data) setMessages(data)
  }

  const subscribeToMessages = () => {
    const mom = moms.find(m => m.user_id === selectedMom)
    if (!mom) return

    const subscription = supabase
      .from('messages')
      .on('*', (payload) => {
        if (
          (payload.new.sender_id === currentUser?.id && payload.new.recipient_id === mom.user_id) ||
          (payload.new.sender_id === mom.user_id && payload.new.recipient_id === currentUser?.id)
        ) {
          setMessages(prev => [...prev, payload.new])
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const sendMessage = async (momId: string) => {
    if (!newMessage.trim() || !currentUser) return
    const mom = moms.find(m => m.user_id === momId)
    if (!mom) return

    const { error } = await supabase
      .from('messages')
      .insert([{
        sender_id: currentUser.id,
        recipient_id: mom.user_id,
        text: newMessage
      }])

    if (!error) {
      setNewMessage('')
    }
  }

  // CHAT VIEW
  if (selectedMom) {
    const mom = moms.find(m => m.user_id === selectedMom)
    return (
      <div className="fixed inset-0 bg-cream text-ink flex flex-col">
        {/* Header */}
        <div className="border-b border-line/30 px-6 py-4 flex items-center gap-4 bg-white">
          <button onClick={() => setSelectedMom(null)} className="text-2xl hover:opacity-70 transition">←</button>
          <div className="text-4xl">{mom?.emoji}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{mom?.users?.name}</h2>
            <p className="text-xs text-muted">🟢 Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-2xl ${
                msg.sender_id === currentUser?.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-ink'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === currentUser?.id ? 'text-rose-100' : 'text-muted'}`}>{new Date(msg.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-line/30 px-6 py-4 flex gap-3 bg-white">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedMom)}
            placeholder="Напиши повідомлення..."
            className="flex-1 bg-gray-50 text-ink rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/30 border border-line/30"
          />
          <button
            onClick={() => sendMessage(selectedMom)}
            className="bg-rose-500 text-white rounded-2xl px-6 py-2 hover:bg-rose-600 transition font-semibold"
          >
            Надіслати
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line/30 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            PRO<span className="text-rose-500">MAM</span>
          </h1>
          <div className="text-sm text-muted">👋 {currentUser?.name || 'Гість'}</div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-5 py-12">
        {activeTab === 'discover' && (
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-10">🗺️ Мами поруч ({moms.length})</h2>

            {moms.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-12 text-center">
                <p className="text-muted font-semibold">Немає зареєстрованих мам</p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                {/* Map Panel */}
                <div className="lg:col-span-2 rounded-2xl border border-line bg-white p-6 h-96 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50">
                    <div className="text-center">
                      <div className="text-5xl mb-4">🗺️</div>
                      <p className="text-muted font-semibold">Карта з мамами (скоро Google Maps)</p>
                      <p className="text-sm text-muted mt-2">Зараз показуємо {moms.length} мам поруч в Києві</p>
                    </div>
                  </div>
                </div>

                {/* Moms List Panel */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg px-2">Мами поруч</h3>
                  {moms.map(mom => (
                    <button
                      key={mom.user_id}
                      onClick={() => setSelectedMom(mom.user_id)}
                      className="w-full rounded-2xl border border-line bg-white p-4 hover:shadow-md transition text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{mom.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{mom.users?.name}</h4>
                          <p className="text-xs text-muted">{mom.age} років • {mom.child_age}</p>
                          <p className="text-xs text-rose-600 font-medium mt-1">⭐ {mom.rating}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-3 flex-wrap">
                        {mom.interests?.slice(0, 2).map((interest: string) => (
                          <span key={interest} className="text-xs bg-rose-50 px-2 py-1 rounded text-rose-700">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && (
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-10">Мої чати</h2>
            {moms.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-12 text-center max-w-2xl">
                <p className="text-muted font-semibold">Немає активних чатів</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {moms.map(mom => (
                  <button
                    key={mom.user_id}
                    onClick={() => setSelectedMom(mom.user_id)}
                    className="w-full bg-white rounded-2xl p-4 border border-line hover:border-rose-500 text-left transition flex items-center gap-4"
                  >
                    <div className="text-3xl">{mom.emoji}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{mom.users?.name}</p>
                      <p className="text-sm text-muted">💬 Напиши першою...</p>
                    </div>
                    <div className="text-muted">→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold tracking-tight mb-6">Подруги</h2>
            <p className="text-muted mb-8">У тебе поки немає подруг</p>
            <button className="bg-rose-500 text-white rounded-2xl px-8 py-3 font-semibold hover:bg-rose-600 transition">
              Знайти подругу
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-10">Профіль</h2>

            {/* User Card */}
            <div className="max-w-2xl rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8 mb-8">
              <div className="flex items-center gap-6">
                <div className="text-6xl">👤</div>
                <div>
                  <h3 className="text-3xl font-bold">{currentUser?.name || 'Гість'}</h3>
                  <p className="text-muted">@{currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || 'guest'}</p>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="max-w-2xl space-y-4 mb-8">
              <div className="bg-white rounded-2xl p-4 border border-line">
                <p className="text-xs text-muted font-semibold mb-2">EMAIL</p>
                <p className="font-semibold text-lg">{currentUser?.email || 'email@example.com'}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-line">
                <p className="text-xs text-muted font-semibold mb-2">ДИТИНА</p>
                <p className="font-semibold text-lg">Синочок, 2 роки</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-line">
                <p className="text-xs text-muted font-semibold mb-2">ЛОКАЦІЯ</p>
                <p className="font-semibold text-lg">м. Київ, Центр</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => { localStorage.removeItem('currentUser'); router.push('/'); }}
              className="max-w-2xl w-full bg-red-50 text-red-600 border border-red-200 rounded-2xl py-3 font-semibold hover:bg-red-100 transition"
            >
              Вийти з акаунту
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-line/30 flex bg-white shadow-lg">
        {[
          { tab: 'discover' as const, icon: '🔍', label: 'Знайти' },
          { tab: 'chats' as const, icon: '💬', label: 'Чати' },
          { tab: 'friends' as const, icon: '👭', label: 'Друзі' },
          { tab: 'profile' as const, icon: '👤', label: 'Я' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex-1 py-4 text-center transition font-semibold ${
              activeTab === item.tab
                ? 'text-rose-500 border-t-2 border-rose-500 bg-rose-50'
                : 'text-muted hover:text-ink'
            }`}
          >
            <div className="text-xl">{item.icon}</div>
            <div className="text-xs mt-1">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Padding for bottom nav */}
      <div className="h-20" />
    </div>
  )
}
