import type { MeetFormat } from '@/lib/types'

export const FORMATS: Record<
  MeetFormat,
  { emoji: string; label: string; short: string; hint: string; color: string }
> = {
  coffee: {
    emoji: '☕',
    label: 'Кава',
    short: 'Кава',
    hint: 'Посидіти в кав’ярні поруч',
    color: '#C9743B',
  },
  walk: {
    emoji: '🚶',
    label: 'Прогулянка',
    short: 'Прогулянка',
    hint: 'Пройтися з візочком у парку',
    color: '#4C8B6F',
  },
  playground: {
    emoji: '🎈',
    label: 'Майданчик',
    short: 'Майданчик',
    hint: 'Зустрітися на дитячому майданчику',
    color: '#C0527E',
  },
  neighbors: {
    emoji: '🏠',
    label: 'Сусідки',
    short: 'Сусідки',
    hint: 'Мами з твого будинку чи двору',
    color: '#5B6BB5',
  },
  activity: {
    emoji: '🧘',
    label: 'Активність',
    short: 'Активність',
    hint: 'Спорт, йога, басейн разом',
    color: '#8C5BB5',
  },
  help: {
    emoji: '🤝',
    label: 'Допомога',
    short: 'Допомога',
    hint: 'Посидіти з дитиною, підвезти, позичити',
    color: '#C2903A',
  },
}

export const FORMAT_LIST = Object.keys(FORMATS) as MeetFormat[]

export const INTERESTS = [
  'Перша дитина',
  'Двійня',
  'Багатодітна',
  'ГВ',
  'Слінг',
  'Йога',
  'Біг',
  'Басейн',
  'Книжки',
  'Кіно',
  'Настілки',
  'Кулінарія',
  'Рукоділля',
  'Подорожі',
  'Фотографія',
  'Садівництво',
  'Розвивалки',
  'Монтесорі',
  'Англійська',
  'Декрет і робота',
  'Фріланс',
  'Власна справа',
  'Переселенка',
  'Мама без партнера',
  'Особлива дитина',
]

/** Скільки мітка живе за замовчуванням */
export const DEFAULT_PIN_HOURS = 6
export const MAX_PIN_HOURS = 24
export const MAX_SCHEDULE_DAYS = 7

/** Радіуси пошуку на мапі, метри */
export const RADIUS_OPTIONS = [
  { value: 1000, label: '1 км' },
  { value: 3000, label: '3 км' },
  { value: 5000, label: '5 км' },
  { value: 10_000, label: '10 км' },
  { value: 30_000, label: 'Усе місто' },
]

/** Київ — запасний центр мапи, коли геолокація недоступна */
export const FALLBACK_CENTER: [number, number] = [50.4501, 30.5234]

export const REPORT_REASONS = [
  'Фейковий профіль',
  'Образи чи агресія',
  'Спам чи реклама',
  'Неприйнятні фото',
  'Шахрайство',
  'Небезпечна поведінка',
  'Інше',
]
