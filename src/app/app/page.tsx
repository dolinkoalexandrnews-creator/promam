'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'map' | 'chats' | 'friends' | 'profile'>('map')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [messages, setMessages] = useState<{ [key: number]: Array<{ sender: string; text: string; time: string }> }>({})
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) setCurrentUser(JSON.parse(user))
    const saved = localStorage.getItem('promam_messages')
    if (saved) setMessages(JSON.parse(saved))
  }, [])

  // Sample moms data
  const moms = [
    { id: 1, name: 'Марія', location: 'Центр', distance: 0.3, rating: 4.8, reviews: 12, child_age: 2, emoji: '👩‍🦰' },
    { id: 2, name: 'Наталія', location: 'Майданчик', distance: 0.8, rating: 5, reviews: 5, child_age: 1, emoji: '👩‍🦱' },
    { id: 3, name: 'Ольга', location: 'Парк', distance: 1.2, rating: 4.9, reviews: 8, child_age: 3, emoji: '👩' },
  ]

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

  const renderMap = () => (
    <div className="space-y-4 px-4">
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-3xl p-6 mb-4">
        <h2 className="text-2xl font-bold text-ink mb-2">🗺️ Мами поруч</h2>
        <p className="text-sm text-muted">Знайди подругу для спілкування</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['☕ Кава', '🚶 Прогулянка', '🎈 Майданчик', '🏠 Сусідки'].map(filter => (
          <button key={filter} className="px-4 py-2 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 rounded-full text-sm font-medium whitespace-nowrap hover:shadow-md transition">
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {moms.map(mom => (
          <div key={mom.id} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="text-4xl">{mom.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-text text-lg">{mom.name}</div>
                <div className="text-xs text-muted">{mom.location}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⭐ {mom.rating}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">👶 {mom.child_age}р</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">📍 {mom.distance}км</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedChat(mom.id)}
                className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl hover:shadow-lg transition hover:from-rose-600 hover:to-rose-700"
              >
                💬
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderChats = () => (
    <div className="space-y-4 px-4">
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-3xl p-6 mb-4">
        <h2 className="text-2xl font-bold text-ink mb-2">💬 Твої чати</h2>
        <p className="text-sm text-muted">Спілкуйся з мамами</p>
      </div>

      {moms.slice(0, 2).map(mom => (
        <button
          key={mom.id}
          onClick={() => setSelectedChat(mom.id)}
          className="w-full bg-white rounded-2xl p-4 border border-rose-100 shadow-sm hover:shadow-md transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{mom.emoji}</div>
            <div className="flex-1">
              <div className="font-semibold text-text">{mom.name}</div>
              <div className="text-xs text-muted truncate">{messages[mom.id]?.length > 0 ? messages[mom.id][messages[mom.id].length - 1].text : 'Напиши першою повідомлення...'}</div>
            </div>
            <div className="text-xs text-muted">📱</div>
          </div>
        </button>
      ))}
    </div>
  )

  const renderFriends = () => (
    <div className="space-y-4 px-4">
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-3xl p-6 mb-4">
        <h2 className="text-2xl font-bold text-ink mb-2">👭 Подруги</h2>
        <p className="text-sm text-muted">Знайди подруг зі спільними інтересами</p>
      </div>

      <div className="text-center py-12">
        <p className="text-3xl mb-3">💕</p>
        <p className="text-sm text-muted mb-6">У тебе поки немає подруг</p>
        <button className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl py-3 font-medium hover:shadow-lg transition">
          ✨ Знайти подругу
        </button>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4 px-4">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl p-6 text-white mb-4">
        <div className="flex items-center gap-4">
          <div className="text-6xl">👤</div>
          <div>
            <h2 className="text-2xl font-bold">{currentUser?.name || 'Гість'}</h2>
            <p className="text-rose-100 text-sm">@{currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || 'guest'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-rose-100 space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-lg">👶</span>
          <div>
            <p className="text-xs text-muted">Дитина</p>
            <p className="font-medium">Синочок, 2 роки</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-xs text-muted">Локація</p>
            <p className="font-medium">Центр міста</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-xs text-muted">Інтереси</p>
            <p className="font-medium">Кава ☕, Парки 🌳</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => { localStorage.removeItem('currentUser'); router.push('/'); }}
        className="w-full bg-gradient-to-r from-red-100 to-red-50 text-red-700 rounded-xl py-3 font-medium hover:from-red-200 hover:to-red-100 transition"
      >
        🚪 Вийти
      </button>
    </div>
  )

  if (selectedChat) {
    const mom = moms.find(m => m.id === selectedChat)
    return (
      <div className="fixed inset-0 bg-cream flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-4 flex items-center gap-3 shadow-md">
          <button onClick={() => setSelectedChat(null)} className="text-2xl">←</button>
          <div className="text-3xl">{mom?.emoji}</div>
          <div className="flex-1">
            <h2 className="font-bold">{mom?.name}</h2>
            <p className="text-xs text-rose-100">Online 🟢</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(messages[selectedChat] || []).map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === currentUser?.name ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                msg.sender === currentUser?.name
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                  : 'bg-white text-text border border-rose-100'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === currentUser?.name ? 'text-rose-100' : 'text-muted'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-rose-100 p-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedChat)}
            placeholder="Напиши повідомлення..."
            className="flex-1 bg-rose-50 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            onClick={() => sendMessage(selectedChat)}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:shadow-lg transition"
          >
            ✉️
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-rose-100 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">PRO<span className="text-rose-500">MAM</span></h1>
          <div className="text-sm font-medium text-rose-600">👋 {currentUser?.name || 'Гість'}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 pt-2">
        {activeTab === 'map' && renderMap()}
        {activeTab === 'chats' && renderChats()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 flex justify-around shadow-lg">
        {[
          { tab: 'map' as const, icon: '🗺️', label: 'Карта' },
          { tab: 'chats' as const, icon: '💬', label: 'Чати' },
          { tab: 'friends' as const, icon: '👭', label: 'Друзі' },
          { tab: 'profile' as const, icon: '👤', label: 'Профіль' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex-1 py-3 text-center text-sm font-medium transition border-t-2 ${
              activeTab === item.tab
                ? 'border-rose-500 text-rose-600 bg-rose-50'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <div className="text-xl">{item.icon}</div>
            <div className="text-xs mt-1">{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
