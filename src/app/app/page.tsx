'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'map' | 'chats' | 'friends' | 'profile'>('map')

  // Sample moms data
  const moms = [
    { id: 1, name: 'Марія', location: 'Центр', distance: 0.3, rating: 4.8, reviews: 12, child_age: 2, emoji: '👩‍🦰' },
    { id: 2, name: 'Наталія', location: 'Майданчик', distance: 0.8, rating: 5, reviews: 5, child_age: 1, emoji: '👩‍🦱' },
    { id: 3, name: 'Ольга', location: 'Парк', distance: 1.2, rating: 4.9, reviews: 8, child_age: 3, emoji: '👩' },
  ]

  const renderMap = () => (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['☕ Кава', '🚶 Прогулянка', '🎈 Майданчик', '🏠 Сусідки'].map(filter => (
          <button key={filter} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-medium whitespace-nowrap">
            {filter}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {moms.map(mom => (
          <div key={mom.id} className="bg-white rounded-2xl p-4 border border-line shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-4xl">{mom.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-text">{mom.name}</div>
                <div className="text-xs text-muted">{mom.location}</div>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">⭐ {mom.rating} ({mom.reviews})</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">👶 {mom.child_age}р</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">📍 {mom.distance}км</span>
                </div>
              </div>
              <button className="bg-rose-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-rose-600">
                💬
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderChats = () => (
    <div className="space-y-2">
      <h2 className="text-xl font-bold px-4 pt-4">Чати</h2>
      {moms.slice(0, 2).map(mom => (
        <div key={mom.id} className="bg-white p-4 border-b border-line cursor-pointer hover:bg-sand/50">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{mom.emoji}</div>
            <div className="flex-1">
              <div className="font-semibold text-text">{mom.name}</div>
              <div className="text-xs text-muted truncate">Останнє повідомлення...</div>
            </div>
            <div className="text-xs text-muted">14:32</div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderFriends = () => (
    <div className="space-y-3 p-4">
      <h2 className="text-xl font-bold">Подруги</h2>
      <p className="text-sm text-muted">У тебе поки немає подруг</p>
      <button className="w-full bg-rose-500 text-white rounded-xl py-3 font-medium hover:bg-rose-600">
        Знайти подругу
      </button>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <div className="text-6xl">👤</div>
        <div>
          <h2 className="text-xl font-bold">Тестова Мама</h2>
          <p className="text-sm text-muted">@testova_mama</p>
        </div>
      </div>
      <div className="bg-sand/50 rounded-xl p-4 space-y-2">
        <p className="text-sm"><strong>Дитина:</strong> Синочок, 2 роки</p>
        <p className="text-sm"><strong>Локація:</strong> Центр міста</p>
        <p className="text-sm"><strong>Інтереси:</strong> Кава ☕, Парки 🌳</p>
      </div>
      <button onClick={() => { localStorage.removeItem('currentUser'); router.push('/'); }} className="w-full bg-red-100 text-red-700 rounded-xl py-3 font-medium hover:bg-red-200">
        Вийти
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-cream flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-line px-4 py-3">
        <h1 className="text-lg font-bold">PRO<span className="text-rose-500">MAM</span></h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'map' && renderMap()}
        {activeTab === 'chats' && renderChats()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-line flex justify-around">
        {[
          { tab: 'map' as const, icon: '🗺️', label: 'Карта' },
          { tab: 'chats' as const, icon: '💬', label: 'Чати' },
          { tab: 'friends' as const, icon: '👭', label: 'Друзі' },
          { tab: 'profile' as const, icon: '👤', label: 'Профіль' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex-1 py-3 text-center text-sm font-medium transition ${
              activeTab === item.tab ? 'text-rose-500 border-t-2 border-rose-500' : 'text-muted hover:text-text'
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
