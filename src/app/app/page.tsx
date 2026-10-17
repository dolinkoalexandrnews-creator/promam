'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'discover' | 'chats' | 'friends' | 'profile'>('discover')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedMom, setSelectedMom] = useState<number | null>(null)
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [messages, setMessages] = useState<{ [key: number]: Array<{ sender: string; text: string; time: string }> }>({})
  const [newMessage, setNewMessage] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) setCurrentUser(JSON.parse(user))
    const saved = localStorage.getItem('promam_messages')
    if (saved) setMessages(JSON.parse(saved))
  }, [])

  const formats = [
    { id: 'coffee', emoji: '☕', label: 'Кава', color: 'from-amber-500 to-orange-500' },
    { id: 'walk', emoji: '🚶', label: 'Прогулянка', color: 'from-green-500 to-emerald-500' },
    { id: 'playground', emoji: '🎈', label: 'Майданчик', color: 'from-pink-500 to-rose-500' },
    { id: 'neighbors', emoji: '🏠', label: 'Сусідки', color: 'from-blue-500 to-cyan-500' },
    { id: 'activity', emoji: '⚽', label: 'Активність', color: 'from-purple-500 to-violet-500' },
    { id: 'help', emoji: '🤝', label: 'Допомога', color: 'from-indigo-500 to-blue-500' },
  ]

  const moms = [
    { id: 1, name: 'Марія', location: 'м. Київ, Центр', distance: 0.3, rating: 4.8, reviews: 12, child_age: 2, emoji: '👩‍🦰', formats: ['coffee', 'walk'], bio: 'Люблю кави та парків 💚' },
    { id: 2, name: 'Наталія', location: 'м. Київ, Подільський', distance: 0.8, rating: 5, reviews: 5, child_age: 1, emoji: '👩‍🦱', formats: ['playground', 'help'], bio: 'Мама Матвійчика, готова допомогти' },
    { id: 3, name: 'Ольга', location: 'м. Київ, Шевченківський', distance: 1.2, rating: 4.9, reviews: 8, child_age: 3, emoji: '👩', formats: ['activity', 'walk'], bio: 'Активна мама трьох дітей ⚽' },
    { id: 4, name: 'Вікторія', location: 'м. Київ, Оболонь', distance: 1.5, rating: 4.7, reviews: 10, child_age: 2, emoji: '👩‍🔬', formats: ['coffee', 'neighbors'], bio: 'Шукаю сусідок для дружби' },
    { id: 5, name: 'Софія', location: 'м. Київ, Печерськ', distance: 2.1, rating: 4.9, reviews: 15, child_age: 1, emoji: '👩‍💼', formats: ['coffee', 'activity'], bio: 'Крутіша мама - робимо разом!' },
  ]

  const filteredMoms = selectedFormat
    ? moms.filter(m => m.formats.includes(selectedFormat))
    : moms

  const sendMessage = (momId: number) => {
    if (!newMessage.trim()) return
    const updated = { ...messages }
    if (!updated[momId]) updated[momId] = []
    updated[momId].push({
      sender: currentUser?.name || 'Ви',
      text: newMessage,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    })
    setMessages(updated)
    localStorage.setItem('promam_messages', JSON.stringify(updated))
    setNewMessage('')
  }

  // CHAT VIEW
  if (selectedChat) {
    const mom = moms.find(m => m.id === selectedChat)
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-cream via-white to-rose-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white p-4 flex items-center gap-3 shadow-xl sticky top-0 z-40">
          <button onClick={() => setSelectedChat(null)} className="text-2xl hover:scale-110 transition">←</button>
          <div className="text-4xl">{mom?.emoji}</div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{mom?.name}</h2>
            <p className="text-xs text-rose-100">🟢 Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(messages[selectedChat] || []).map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === currentUser?.name ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-2xl backdrop-blur-sm ${
                msg.sender === currentUser?.name
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/80 text-text border border-rose-200 shadow-md'
              }`}>
                <p className="text-sm font-medium">{msg.text}</p>
                <p className={`text-xs mt-1.5 ${msg.sender === currentUser?.name ? 'text-rose-100' : 'text-muted'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white/90 backdrop-blur-md border-t border-rose-200 p-4 flex gap-2 sticky bottom-0">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedChat)}
            placeholder="Напиши щось гарне..."
            className="flex-1 bg-gradient-to-r from-rose-50 to-pink-50 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 border border-rose-200 font-medium"
          />
          <button
            onClick={() => sendMessage(selectedChat)}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full w-11 h-11 flex items-center justify-center hover:shadow-lg transition transform hover:scale-105 font-bold text-lg"
          >
            ✨
          </button>
        </div>
      </div>
    )
  }

  // DISCOVER TAB
  const renderDiscover = () => (
    <div className="pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 text-white px-4 py-8 sticky top-0 z-30 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Мами поруч 👩‍👧‍👦</h1>
        <p className="text-rose-100 text-sm">Знайди мій тип, розпочни спілкування</p>
      </div>

      {/* Format Filter */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-xs uppercase font-bold text-muted mb-3">Формат зустрічі</p>
        <div className="grid grid-cols-3 gap-2">
          {formats.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(selectedFormat === fmt.id ? null : fmt.id)}
              className={`p-3 rounded-xl transition transform hover:scale-105 font-bold text-center ${
                selectedFormat === fmt.id
                  ? `bg-gradient-to-br ${fmt.color} text-white shadow-lg scale-105`
                  : 'bg-white border-2 border-rose-200 text-text hover:border-rose-400'
              }`}
            >
              <div className="text-2xl mb-1">{fmt.emoji}</div>
              <div className="text-xs">{fmt.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Moms Grid */}
      <div className="px-4 space-y-3">
        {filteredMoms.map(mom => (
          <div
            key={mom.id}
            onClick={() => setSelectedMom(mom.id)}
            className="bg-white rounded-2xl p-4 border-2 border-rose-100 shadow-md hover:shadow-xl transition cursor-pointer transform hover:-translate-y-1 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-5xl">{mom.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-lg text-text">{mom.name}</div>
                <div className="text-xs text-muted flex items-center gap-1 mb-2">
                  <span>📍</span> {mom.location}
                </div>
                <div className="text-sm text-text/80 italic font-medium">{mom.bio}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                ⭐ {mom.rating} ({mom.reviews})
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                👶 {mom.child_age}р
              </div>
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                🛣️ {mom.distance}км
              </div>
            </div>

            {/* Formats */}
            <div className="flex gap-1 mb-4 flex-wrap">
              {mom.formats.map(fmt => {
                const f = formats.find(x => x.id === fmt)
                return <span key={fmt} className="text-lg">{f?.emoji}</span>
              })}
            </div>

            {/* Actions */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedChat(mom.id)
              }}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl py-2.5 font-bold hover:shadow-lg transition transform hover:scale-105"
            >
              💬 Написати
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  // CHATS TAB
  const renderChats = () => (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 text-white px-4 py-8 sticky top-0 z-30 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Мої чати 💬</h1>
        <p className="text-rose-100 text-sm">Спілкуйся з мамами</p>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {moms.map(mom => (
          <button
            key={mom.id}
            onClick={() => setSelectedChat(mom.id)}
            className="w-full bg-white rounded-2xl p-4 border-2 border-rose-100 shadow-md hover:shadow-lg transition text-left backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{mom.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-text">{mom.name}</div>
                <div className="text-xs text-muted truncate">{messages[mom.id]?.length > 0 ? messages[mom.id][messages[mom.id].length - 1].text : '👋 Напиши першою...'}</div>
              </div>
              <div className="text-lg">→</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // FRIENDS TAB
  const renderFriends = () => (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 text-white px-4 py-8 sticky top-0 z-30 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Подруги 👭</h1>
        <p className="text-rose-100 text-sm">Знайди новых подруг</p>
      </div>

      <div className="px-4 pt-8 pb-4 text-center">
        <div className="inline-block bg-gradient-to-br from-rose-100 to-pink-100 rounded-full p-6 mb-4">
          <div className="text-5xl">💕</div>
        </div>
        <p className="text-sm text-muted mb-1">У тебе поки немає подруг</p>
        <p className="text-xs text-muted mb-6">Почни спілкуватися з мамами</p>
        <button className="w-full mx-auto max-w-xs bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl py-3 font-bold hover:shadow-lg transition transform hover:scale-105">
          ✨ Знайти подругу
        </button>
      </div>
    </div>
  )

  // PROFILE TAB
  const renderProfile = () => (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 text-white px-4 py-8 sticky top-0 z-30 shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Профіль 👤</h1>
        <p className="text-rose-100 text-sm">Твої дані</p>
      </div>

      <div className="px-4 pt-6 pb-4 space-y-4">
        {/* User Card */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="text-6xl">👤</div>
            <div>
              <h2 className="text-2xl font-bold">{currentUser?.name || 'Гість'}</h2>
              <p className="text-rose-100 text-sm">@{currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || 'guest'}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl p-4 border-2 border-rose-100 shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">👶</div>
            <div>
              <p className="text-xs text-muted font-bold uppercase">Дитина</p>
              <p className="font-bold text-text">Синочок, 2 роки</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl">📍</div>
            <div>
              <p className="text-xs text-muted font-bold uppercase">Локація</p>
              <p className="font-bold text-text">м. Київ, Центр</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl">✨</div>
            <div>
              <p className="text-xs text-muted font-bold uppercase">Інтереси</p>
              <p className="font-bold text-text">Кава ☕, Парки 🌳</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { localStorage.removeItem('currentUser'); router.push('/'); }}
          className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl py-3 font-bold hover:shadow-lg transition transform hover:scale-105"
        >
          🚪 Вийти з акаунту
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cream via-white to-rose-50 flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'discover' && renderDiscover()}
        {activeTab === 'chats' && renderChats()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t-2 border-rose-200 flex justify-around shadow-2xl">
        {[
          { tab: 'discover' as const, icon: '🔍', label: 'Знайти' },
          { tab: 'chats' as const, icon: '💬', label: 'Чати' },
          { tab: 'friends' as const, icon: '👭', label: 'Друзі' },
          { tab: 'profile' as const, icon: '👤', label: 'Я' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex-1 py-3 text-center transition font-bold ${
              activeTab === item.tab
                ? 'bg-gradient-to-b from-rose-100 to-transparent text-rose-600 border-t-2 border-rose-500'
                : 'text-muted hover:text-text'
            }`}
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="text-xs mt-0.5">{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
