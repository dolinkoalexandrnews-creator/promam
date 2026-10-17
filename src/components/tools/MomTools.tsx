'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui/controls'

const TOOLS = [
  { id: 'feeding', icon: '🍼', title: 'Графік годування', emoji: true },
  { id: 'sleep', icon: '😴', title: 'Сон малюка', emoji: true },
  { id: 'development', icon: '👶', title: 'Розвиток', emoji: true },
  { id: 'health', icon: '⚕️', title: 'Здоров\'я', emoji: true },
  { id: 'activities', icon: '🎨', title: 'Розваги', emoji: true },
  { id: 'shopping', icon: '🛒', title: 'Список покупок', emoji: true },
]

export function MomTools() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [feedings, setFeedings] = useState<Array<{ time: string; type: string }>>([])
  const [sleepLog, setSleepLog] = useState<Array<{ time: string; duration: number }>>([])
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; done: boolean }>>([])
  const [newItem, setNewItem] = useState('')

  const addFeeding = () => {
    const now = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    setFeedings([...feedings, { time: now, type: 'груд' }])
  }

  const addSleep = () => {
    const now = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    setSleepLog([...sleepLog, { time: now, duration: 60 }])
  }

  const addChecklistItem = () => {
    if (!newItem.trim()) return
    setChecklist([...checklist, { id: Date.now().toString(), text: newItem, done: false }])
    setNewItem('')
  }

  const toggleChecklist = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item))
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Вибір інструменту */}
      {!selectedTool ? (
        <>
          <div className="sticky top-0 z-10 bg-white/90 px-4 py-6 backdrop-blur border-b border-pink-100">
            <h1 className="text-2xl font-bold text-text">Мамині Інструменти 💪</h1>
            <p className="mt-1 text-sm text-muted">Все що потрібно для мами в декреті</p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 pb-24">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-pink-100 transition hover:shadow-md hover:ring-pink-300 active:scale-95"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition">{tool.icon}</div>
                <div className="text-sm font-semibold text-text text-left">{tool.title}</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="pb-24">
          {/* Заголовок інструменту */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-4 text-white">
            <button
              onClick={() => setSelectedTool(null)}
              className="mb-2 text-sm font-medium opacity-80 hover:opacity-100"
            >
              ← Назад
            </button>
            <h2 className="text-2xl font-bold">{TOOLS.find(t => t.id === selectedTool)?.title}</h2>
          </div>

          {/* Годування */}
          {selectedTool === 'feeding' && (
            <div className="p-4">
              <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-bold text-text mb-4">🍼 Останні годування</h3>
                <Button onClick={addFeeding} className="w-full mb-4">
                  + Додати годування
                </Button>
                <div className="space-y-2">
                  {feedings.length === 0 ? (
                    <p className="text-center text-muted py-4">Поки нічого</p>
                  ) : (
                    feedings.map((f, i) => (
                      <div key={i} className="flex justify-between p-2 bg-pink-50 rounded">
                        <span className="font-medium">{f.time}</span>
                        <span className="text-muted">{f.type}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Сон */}
          {selectedTool === 'sleep' && (
            <div className="p-4">
              <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-bold text-text mb-4">😴 Графік сну</h3>
                <Button onClick={addSleep} className="w-full mb-4">
                  + Малюк заснув
                </Button>
                <div className="space-y-2">
                  {sleepLog.length === 0 ? (
                    <p className="text-center text-muted py-4">Сніщів ще нема</p>
                  ) : (
                    sleepLog.map((s, i) => (
                      <div key={i} className="flex justify-between p-2 bg-purple-50 rounded">
                        <span className="font-medium">{s.time}</span>
                        <span className="text-muted">{s.duration} хв</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Чеклист */}
          {selectedTool === 'shopping' && (
            <div className="p-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-bold text-text mb-4">🛒 Список покупок</h3>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Що купити?"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                  />
                  <Button onClick={addChecklistItem} size="sm">+</Button>
                </div>
                <div className="space-y-2">
                  {checklist.length === 0 ? (
                    <p className="text-center text-muted py-4">Список порожній</p>
                  ) : (
                    checklist.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklist(item.id)}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          item.done
                            ? 'bg-green-100 line-through text-green-700'
                            : 'bg-pink-50 text-text hover:bg-pink-100'
                        }`}
                      >
                        <span className="mr-2">{item.done ? '✅' : '☐'}</span>
                        {item.text}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Розвиток */}
          {selectedTool === 'development' && (
            <div className="p-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-bold text-text mb-4">👶 Вехи розвитку</h3>
                <div className="space-y-2">
                  {[
                    '😊 Перша посмішка',
                    '👀 Фокусування зору',
                    '🤚 Хватання предметів',
                    '🔊 Гулі звуки',
                    '🙌 Перевертання',
                    '🍴 Перший прикорм',
                  ].map((milestone, i) => (
                    <div key={i} className="p-3 bg-purple-50 rounded-lg font-medium text-text">
                      {milestone}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Здоров'я */}
          {selectedTool === 'health' && (
            <div className="p-4">
              <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                <h3 className="font-bold text-text mb-4">⚕️ Здоров'я малюка</h3>
                {[
                  { label: 'Температура нормальна', emoji: '🌡️' },
                  { label: 'Аппетит гарний', emoji: '🍼' },
                  { label: 'Спить спокійно', emoji: '😴' },
                  { label: 'Без висипу', emoji: '🌸' },
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.emoji} {item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Розваги */}
          {selectedTool === 'activities' && (
            <div className="p-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-bold text-text mb-4">🎨 Ідеї розвивальних занять</h3>
                <div className="space-y-2">
                  {[
                    '🎵 Слухаємо музику',
                    '📚 Читаємо книги',
                    '🌈 Фарбуємо пальчиковими красками',
                    '🧩 Зібираємо головоломку',
                    '🏃 Танцюємо разом',
                    '🌿 Розглядаємо природу',
                  ].map((activity, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition font-medium"
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
