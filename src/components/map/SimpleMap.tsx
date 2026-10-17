'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/controls'

const DEMO_PINS = [
  {
    id: 1,
    name: 'Марія',
    format: '☕',
    formatName: 'Кава',
    location: 'Кава в центрі',
    time: '14:00',
    distance: '0.3 км',
    rating: 4.8,
    reviews: 12,
    age: '2 роки',
    photo: '👧'
  },
  {
    id: 2,
    name: 'Наталія',
    format: '🎈',
    formatName: 'Майданчик',
    location: 'На майданчику',
    time: '15:30',
    distance: '0.8 км',
    rating: 5.0,
    reviews: 8,
    age: '1 рік',
    photo: '👧'
  },
  {
    id: 3,
    name: 'Ольга',
    format: '🚶',
    formatName: 'Прогулянка',
    location: 'Прогулянка в парку',
    time: '16:00',
    distance: '1.2 км',
    rating: 4.6,
    reviews: 15,
    age: '3 роки',
    photo: '👧'
  },
  {
    id: 4,
    name: 'Вікторія',
    format: '🏠',
    formatName: 'Сусідки',
    location: 'Сусідки в будинку',
    time: '17:00',
    distance: '0.2 км',
    rating: 4.9,
    reviews: 5,
    age: '4 роки',
    photo: '👧'
  },
  {
    id: 5,
    name: 'Софія',
    format: '☕',
    formatName: 'Кава',
    location: 'Кав\'ярня "Берег"',
    time: '13:00',
    distance: '1.5 км',
    rating: 4.7,
    reviews: 20,
    age: '1.5 років',
    photo: '👧'
  },
]

const FILTERS = [
  { key: null, label: 'Усі', emoji: '✨' },
  { key: '☕', label: 'Кава', emoji: '☕' },
  { key: '🎈', label: 'Майданчик', emoji: '🎈' },
  { key: '🚶', label: 'Прогулянка', emoji: '🚶' },
  { key: '🏠', label: 'Сусідки', emoji: '🏠' },
]

export function SimpleMap() {
  const [selectedPin, setSelectedPin] = useState<number | null>(null)
  const [filters, setFilters] = useState<string | null>(null)

  const filteredPins = filters ? DEMO_PINS.filter(p => p.format === filters) : DEMO_PINS

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-gradient-to-b from-cream via-rose-50/20 to-cream">
      {/* Красивой Фільтри */}
      <div className="sticky top-0 border-b border-line/30 bg-white/80 backdrop-blur-xl px-4 py-4 z-20 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Формат зустрічі</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilters(f.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                filters === f.key
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 scale-105'
                  : 'bg-white text-ink hover:bg-rose-50 border border-line hover:border-rose-300'
              }`}
            >
              <span className="text-lg">{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Список мам */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-lg text-ink">🗺️ Мами поруч</h2>
          <span className="text-xs font-medium bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
            {filteredPins.length} мам
          </span>
        </div>

        <div className="space-y-3 pb-6">
          {filteredPins.map((pin) => (
            <button
              key={pin.id}
              onClick={() => setSelectedPin(selectedPin === pin.id ? null : pin.id)}
              className={`w-full text-left transition-all duration-300 transform ${
                selectedPin === pin.id ? 'scale-100' : 'hover:scale-102'
              }`}
            >
              <div
                className={`rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  selectedPin === pin.id
                    ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-white shadow-xl'
                    : 'border-line bg-white hover:border-rose-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Картка сверху */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Фото */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                        {pin.photo}
                      </div>

                      {/* Інфо */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-ink text-lg leading-tight">{pin.name}</h3>
                        <p className="text-xs text-muted mt-0.5">{pin.location}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                            👶 {pin.age}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Формат */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl">{pin.format}</div>
                      <div className="text-xs text-muted font-medium mt-1">{pin.formatName}</div>
                    </div>
                  </div>

                  {/* Час и расстояние */}
                  <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b border-line">
                    <div className="flex items-center gap-1.5 text-muted">
                      <span>🕐</span>
                      <span className="font-medium text-ink">{pin.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted">
                      <span>📍</span>
                      <span className="font-medium text-ink">{pin.distance}</span>
                    </div>
                  </div>

                  {/* Рейтинг */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span>⭐</span>
                      <span className="font-semibold text-ink">{pin.rating}</span>
                    </div>
                    <span className="text-xs text-muted">({pin.reviews} відгуків)</span>
                  </div>
                </div>

                {/* Розширена інформація */}
                {selectedPin === pin.id && (
                  <div className="border-t border-line bg-gradient-to-b from-rose-50/50 to-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
                    <p className="text-sm text-muted">
                      💚 Тобі буде цікаво спілкуватись з {pin.name}! Дитина близька за віком.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30">
                        💬 Написати
                      </button>
                      <button className="bg-white border-2 border-rose-500 text-rose-600 rounded-xl py-2.5 font-semibold text-sm hover:bg-rose-50 transition-all">
                        ✅ Приєднатися
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
