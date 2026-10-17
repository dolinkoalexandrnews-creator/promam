'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui/controls'

const FORMATS = [
  { id: 'coffee', emoji: '☕', title: 'Кава', desc: 'На кавецьку з малюками' },
  { id: 'playground', emoji: '🎈', title: 'Майданчик', desc: 'На дитячий майданчик' },
  { id: 'walk', emoji: '🚶', title: 'Прогулянка', desc: 'На спокійну прогулянку' },
  { id: 'park', emoji: '🌳', title: 'У парк', desc: 'В парк на свіже повітря' },
]

const TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export function PlanWalkies() {
  const [step, setStep] = useState<'invite' | 'plan'>('invite')
  const [friend, setFriend] = useState('')
  const [friends, setFriends] = useState<string[]>([])
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [plans, setPlans] = useState<Array<{ format: string; time: string; date: string; friend: string }>>([])
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)

  const addFriend = () => {
    if (!friend.trim()) return
    if (friends.includes(friend)) {
      alert('Ця подруга вже додана')
      return
    }
    setFriends([...friends, friend])
    setFriend('')
  }

  const createPlan = () => {
    if (!selectedFormat || !selectedTime || !selectedDate || !selectedFriend) {
      alert('Обери всі параметри')
      return
    }

    const format = FORMATS.find(f => f.id === selectedFormat)
    setPlans([...plans, { format: format?.title || '', time: selectedTime, date: selectedDate, friend: selectedFriend }])

    // Reset
    setSelectedFormat(null)
    setSelectedTime(null)
    setSelectedDate('')
    setSelectedFriend(null)
  }

  const removePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-amber-50 to-rose-50">
      {step === 'invite' ? (
        <>
          <div className="sticky top-0 z-10 bg-white/90 px-4 py-6 backdrop-blur border-b border-amber-100">
            <h1 className="text-2xl font-bold text-text">Запрости подругу 👯</h1>
            <p className="mt-1 text-sm text-muted">Додай своїх подруг і плануйте прогулянки разом</p>
          </div>

          <div className="p-4 pb-24">
            <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-amber-100">
              <h2 className="font-bold text-text mb-3">Додай подругу</h2>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Ім'я подруги"
                  value={friend}
                  onChange={(e) => setFriend(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFriend()}
                />
                <Button onClick={addFriend} size="sm">+</Button>
              </div>

              {friends.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text">Твої подруги:</p>
                  {friends.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👩</span>
                        <span className="font-medium">{f}</span>
                      </div>
                      <button
                        onClick={() => setFriends(friends.filter((_, idx) => idx !== i))}
                        className="text-sm text-rose-600 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {friends.length > 0 && (
              <Button onClick={() => setStep('plan')} className="w-full">
                Перейти до планування →
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="sticky top-0 z-10 bg-white/90 px-4 py-6 backdrop-blur border-b border-amber-100">
            <button
              onClick={() => setStep('invite')}
              className="mb-2 text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              ← Назад
            </button>
            <h1 className="text-2xl font-bold text-text">Планування прогулянок 📅</h1>
          </div>

          <div className="p-4 pb-24">
            {/* Форма планування */}
            <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-amber-100">
              <h2 className="font-bold text-text mb-4">+ Нова прогулянка</h2>

              {/* Формат */}
              <div className="mb-4">
                <p className="text-sm font-medium text-text mb-2">Формат</p>
                <div className="grid grid-cols-2 gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`rounded-lg p-3 text-center transition ${
                        selectedFormat === f.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-text hover:bg-amber-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">{f.emoji}</div>
                      <div className="text-sm font-medium">{f.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Дата */}
              <div className="mb-4">
                <p className="text-sm font-medium text-text mb-2">Дата</p>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Час */}
              <div className="mb-4">
                <p className="text-sm font-medium text-text mb-2">Час</p>
                <div className="grid grid-cols-4 gap-2">
                  {TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`rounded-lg p-2 text-sm font-medium transition ${
                        selectedTime === t
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-text hover:bg-amber-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Подруга */}
              <div className="mb-4">
                <p className="text-sm font-medium text-text mb-2">З якою подругою?</p>
                <div className="space-y-2">
                  {friends.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFriend(f)}
                      className={`w-full rounded-lg p-3 text-left transition ${
                        selectedFriend === f
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-text hover:bg-amber-100'
                      }`}
                    >
                      👩 {f}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={createPlan} className="w-full">
                Додати прогулянку
              </Button>
            </div>

            {/* Список прогулянок */}
            {plans.length > 0 && (
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-amber-100">
                <h2 className="font-bold text-text mb-4">Заплановані прогулянки</h2>
                <div className="space-y-3">
                  {plans.map((plan, i) => (
                    <div key={i} className="flex items-start justify-between p-3 bg-amber-50 rounded-lg">
                      <div>
                        <p className="text-2xl mb-1">{FORMATS.find(f => f.title === plan.format)?.emoji}</p>
                        <p className="font-semibold text-text">{plan.format}</p>
                        <p className="text-sm text-muted">📅 {plan.date} ⏰ {plan.time}</p>
                        <p className="text-sm text-muted">👯 з {plan.friend}</p>
                      </div>
                      <button
                        onClick={() => removePlan(i)}
                        className="text-rose-600 hover:text-rose-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
