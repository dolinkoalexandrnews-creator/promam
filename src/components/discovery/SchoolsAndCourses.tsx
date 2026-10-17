'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui/controls'

const CITIES = [
  { id: 'kyiv', name: 'Київ' },
  { id: 'kharkiv', name: 'Харків' },
  { id: 'odesa', name: 'Одеса' },
  { id: 'lviv', name: 'Львів' },
  { id: 'dnipro', name: 'Дніпро' },
  { id: 'donetsk', name: 'Донецьк' },
  { id: 'zaporizhzhia', name: 'Запоріжжя' },
]

const DEMO_SCHOOLS = {
  kyiv: [
    { id: 1, name: 'Садочок "Сонечко"', address: 'вул. Героїв Космосу, 10', ages: '1-3' },
    { id: 2, name: 'Дитячий центр "Малюк"', address: 'вул. Кутузова, 25', ages: '2-5' },
    { id: 3, name: 'Садочок "Казка"', address: 'пр. Перемоги, 100', ages: '1-4' },
  ],
  kharkiv: [
    { id: 4, name: 'Садочок №5', address: 'вул. Квітня, 15', ages: '1-3' },
    { id: 5, name: 'Дитячий центр "Пізнайко"', address: 'вул. Московська, 40', ages: '2-4' },
  ],
}

const DEMO_COURSES = {
  kyiv: [
    { id: 1, name: 'Кінезіологія для малюків', category: 'фізичний розвиток', age: '1-3' },
    { id: 2, name: 'Музика для найменших', category: 'творчість', age: '0-2' },
    { id: 3, name: 'Вивчення мов', category: 'навчання', age: '2-4' },
    { id: 4, name: 'Мистецтво та ремесла', category: 'творчість', age: '2-5' },
  ],
  kharkiv: [
    { id: 5, name: 'Плавання для малюків', category: 'спорт', age: '1-3' },
    { id: 6, name: 'Англійська для дітей', category: 'навчання', age: '2-4' },
  ],
}

export function SchoolsAndCourses() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [searchSchool, setSearchSchool] = useState('')
  const [searchCourse, setSearchCourse] = useState('')
  const [activeTab, setActiveTab] = useState<'schools' | 'courses'>('schools')

  const schools = selectedCity ? (DEMO_SCHOOLS[selectedCity as keyof typeof DEMO_SCHOOLS] || []) : []
  const courses = selectedCity ? (DEMO_COURSES[selectedCity as keyof typeof DEMO_COURSES] || []) : []

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(searchSchool.toLowerCase()),
  )
  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchCourse.toLowerCase()),
  )

  return (
    <div className="min-h-dvh bg-cream">
      {/* Вибір міста */}
      <div className="sticky top-0 z-10 border-b border-line bg-white/90 p-4 backdrop-blur">
        <h2 className="mb-3 text-lg font-semibold">Вибери своє місто</h2>
        <div className="grid grid-cols-2 gap-2">
          {CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                selectedCity === city.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-text ring-1 ring-line hover:ring-rose-300'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedCity ? (
        <div className="grid h-96 place-items-center px-4 text-center">
          <div>
            <div className="mb-4 text-4xl">🌍</div>
            <p className="text-muted">Обери місто щоб побачити садочки та курси</p>
          </div>
        </div>
      ) : (
        <div className="pb-6">
          {/* Табулятори */}
          <div className="sticky top-14 z-10 flex border-b border-line bg-white/90 px-4 backdrop-blur">
            <button
              onClick={() => setActiveTab('schools')}
              className={`flex-1 py-3 text-center font-medium transition ${
                activeTab === 'schools'
                  ? 'border-b-2 border-rose-500 text-rose-500'
                  : 'text-muted'
              }`}
            >
              Садочки
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 py-3 text-center font-medium transition ${
                activeTab === 'courses'
                  ? 'border-b-2 border-rose-500 text-rose-500'
                  : 'text-muted'
              }`}
            >
              Курси
            </button>
          </div>

          {/* Садочки */}
          {activeTab === 'schools' && (
            <div className="p-4">
              <Input
                placeholder="Пошук садочка..."
                value={searchSchool}
                onChange={(e) => setSearchSchool(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-3">
                {filteredSchools.length === 0 ? (
                  <p className="py-8 text-center text-muted">Нічого не знайдено</p>
                ) : (
                  filteredSchools.map((school) => (
                    <div key={school.id} className="rounded-lg bg-white p-4 shadow-sm">
                      <h3 className="font-semibold text-text">{school.name}</h3>
                      <p className="mt-1 text-sm text-muted">{school.address}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted">Вік: {school.ages}</span>
                        <Button size="sm">Дізнатися більше</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Курси */}
          {activeTab === 'courses' && (
            <div className="p-4">
              <Input
                placeholder="Пошук курсу..."
                value={searchCourse}
                onChange={(e) => setSearchCourse(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-3">
                {filteredCourses.length === 0 ? (
                  <p className="py-8 text-center text-muted">Нічого не знайдено</p>
                ) : (
                  filteredCourses.map((course) => (
                    <div key={course.id} className="rounded-lg bg-white p-4 shadow-sm">
                      <h3 className="font-semibold text-text">{course.name}</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-block rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                          {course.category}
                        </span>
                        <span className="text-xs text-muted">Вік: {course.age}</span>
                      </div>
                      <Button size="sm" className="mt-3 w-full">
                        Записатися
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
