'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'discover' | 'chats' | 'friends' | 'profile'>('discover')
  const [selectedMom, setSelectedMom] = useState<number | null>(null)
  const [messages, setMessages] = useState<{ [key: number]: any[] }>({})
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) setCurrentUser(JSON.parse(user))
    const saved = localStorage.getItem('promam_messages')
    if (saved) setMessages(JSON.parse(saved))
  }, [])

  const moms = [
    { id: 1, name: 'Марія', emoji: '👩‍🦰', age: 28, child: '2 роки', rating: 4.8, interests: ['Кава', 'Парки', 'Книги'] },
    { id: 2, name: 'Наталія', emoji: '👩‍🦱', age: 32, child: '1 рік', rating: 5.0, interests: ['Йога', 'Готування', 'Мистецтво'] },
    { id: 3, name: 'Ольга', emoji: '👩', age: 26, child: '3 роки', rating: 4.9, interests: ['Спорт', 'Подорожі', 'Фото'] },
    { id: 4, name: 'Вікторія', emoji: '👩‍🔬', age: 30, child: '18 місяців', rating: 4.7, interests: ['Розвиток', 'Музика', 'Мода'] },
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

  // CHAT VIEW
  if (selectedMom) {
    const mom = moms.find(m => m.id === selectedMom)
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col">
        {/* Tesla-style Header */}
        <div className="border-b border-gray-700 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSelectedMom(null)} className="text-2xl hover:opacity-70 transition">←</button>
          <div className="text-4xl">{mom?.emoji}</div>
          <div className="flex-1">
            <h2 className="text-xl font-light">{mom?.name}</h2>
            <p className="text-xs text-gray-400">🟢 Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(messages[selectedMom] || []).map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === currentUser?.name ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-lg ${
                msg.sender === currentUser?.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 px-6 py-4 flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedMom)}
            placeholder="Напиши повідомлення..."
            className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2 text-sm outline-none focus:bg-gray-800 transition border border-gray-700"
          />
          <button
            onClick={() => sendMessage(selectedMom)}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 transition font-light"
          >
            Надіслати
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Tesla-style Header */}
      <div className="border-b border-gray-800 px-8 py-6 flex items-center justify-between">
        <h1 className="text-3xl font-light tracking-wider">PROMAM</h1>
        <div className="text-sm text-gray-400">👋 {currentUser?.name || 'Гість'}</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'discover' && (
          <div className="p-8 max-w-6xl mx-auto">
            <h2 className="text-4xl font-light mb-12 tracking-wide">Знайди свою маму</h2>

            {/* Moms Grid - Tesla Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {moms.map(mom => (
                <div
                  key={mom.id}
                  onClick={() => setSelectedMom(mom.id)}
                  className="group bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 cursor-pointer transition duration-300 hover:bg-gray-800"
                >
                  {/* Mom Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-5xl">{mom.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-light">{mom.name}</h3>
                      <p className="text-sm text-gray-400">{mom.age} років</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-light">⭐ {mom.rating}</div>
                    </div>
                  </div>

                  {/* Child Info */}
                  <div className="mb-6 pb-6 border-b border-gray-800">
                    <p className="text-sm text-gray-400">Дитина</p>
                    <p className="text-lg font-light">{mom.child}</p>
                  </div>

                  {/* Interests */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-3">Інтереси</p>
                    <div className="flex flex-wrap gap-2">
                      {mom.interests.map(interest => (
                        <span key={interest} className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-300">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedMom(mom.id)
                    }}
                    className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-light hover:bg-blue-700 transition"
                  >
                    Написати
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-4xl font-light mb-12 tracking-wide">Мої чати</h2>
            <div className="space-y-3">
              {moms.map(mom => (
                <button
                  key={mom.id}
                  onClick={() => setSelectedMom(mom.id)}
                  className="w-full bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-blue-500 text-left transition flex items-center gap-4"
                >
                  <div className="text-3xl">{mom.emoji}</div>
                  <div className="flex-1">
                    <p className="font-light text-lg">{mom.name}</p>
                    <p className="text-sm text-gray-400">{messages[mom.id]?.length > 0 ? messages[mom.id][messages[mom.id].length - 1].text : 'Напиши першою...'}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="p-8 max-w-4xl mx-auto text-center py-20">
            <h2 className="text-4xl font-light mb-6 tracking-wide">Подруги</h2>
            <p className="text-gray-400 mb-8">У тебе поки немає подруг</p>
            <button className="bg-blue-600 text-white rounded-lg px-8 py-3 font-light hover:bg-blue-700 transition">
              Знайти подругу
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-8 max-w-4xl mx-auto">
            <h2 className="text-4xl font-light mb-12 tracking-wide">Профіль</h2>

            {/* User Card */}
            <div className="bg-gradient-to-br from-blue-900 to-black rounded-lg p-8 border border-blue-500/30 mb-8">
              <div className="flex items-center gap-6">
                <div className="text-6xl">👤</div>
                <div>
                  <h3 className="text-3xl font-light">{currentUser?.name || 'Гість'}</h3>
                  <p className="text-gray-400">@{currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || 'guest'}</p>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-2">EMAIL</p>
                <p className="font-light text-lg">{currentUser?.email || 'email@example.com'}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-2">ДИТИНА</p>
                <p className="font-light text-lg">Синочок, 2 роки</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-xs text-gray-400 mb-2">ЛОКАЦІЯ</p>
                <p className="font-light text-lg">м. Київ, Центр</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => { localStorage.removeItem('currentUser'); router.push('/'); }}
              className="w-full bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg py-3 font-light hover:bg-red-600/30 transition"
            >
              Вийти з акаунту
            </button>
          </div>
        )}
      </div>

      {/* Tesla-style Bottom Nav */}
      <div className="border-t border-gray-800 flex">
        {[
          { tab: 'discover' as const, icon: '🔍', label: 'Знайти' },
          { tab: 'chats' as const, icon: '💬', label: 'Чати' },
          { tab: 'friends' as const, icon: '👭', label: 'Друзі' },
          { tab: 'profile' as const, icon: '👤', label: 'Я' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex-1 py-4 text-center transition border-t-2 ${
              activeTab === item.tab
                ? 'border-blue-500 text-blue-400 bg-gray-900'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="text-xl">{item.icon}</div>
            <div className="text-xs mt-1 font-light tracking-wide">{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
