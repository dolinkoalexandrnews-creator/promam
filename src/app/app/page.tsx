'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false })

export default function AppPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'map' | 'chats' | 'friends' | 'profile'>('map')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      setCurrentUser(JSON.parse(user))
    }

    // Запросить геолокацію
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
          localStorage.setItem('userLocation', JSON.stringify([position.coords.latitude, position.coords.longitude]))
        },
        (error) => console.log('Геолокація недоступна:', error)
      )
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cream via-white to-rose-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white px-4 py-4 sticky top-0 z-40 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">PRO<span className="text-white">MAM</span> 👩‍👧‍👦</h1>
          <div className="text-sm font-medium">👋 {currentUser?.name || 'Гість'}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'map' && <MapComponent userLocation={userLocation} />}
        {activeTab === 'chats' && (
          <div className="p-4 text-center pt-20">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-muted">Чати - скоро буде 🔄</p>
          </div>
        )}
        {activeTab === 'friends' && (
          <div className="p-4 text-center pt-20">
            <div className="text-5xl mb-4">👭</div>
            <p className="text-muted">Друзі - скоро буде 🔄</p>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="p-4 pt-6">
            <div className="bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl p-6 shadow-xl mb-4">
              <div className="flex items-center gap-4">
                <div className="text-6xl">👤</div>
                <div>
                  <h2 className="text-2xl font-bold">{currentUser?.name || 'Гість'}</h2>
                  <p className="text-rose-100">@{currentUser?.name?.toLowerCase().replace(/\s+/g, '_') || 'guest'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { localStorage.removeItem('currentUser'); router.push('/'); }}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl py-3 font-bold hover:shadow-lg transition"
            >
              🚪 Вийти
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t-2 border-rose-200 flex justify-around shadow-2xl">
        {[
          { tab: 'map' as const, icon: '🗺️', label: 'Карта' },
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
