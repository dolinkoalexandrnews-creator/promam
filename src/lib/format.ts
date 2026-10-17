import type { ChildInfo } from '@/lib/types'

/** «2 роки 3 міс», «8 міс», «щойно народилась» */
export function childAge(months: number): string {
  if (months < 1) return 'щойно народилась'
  if (months < 12) return `${months} міс`
  const years = Math.floor(months / 12)
  const rest = months % 12
  const y = plural(years, 'рік', 'роки', 'років')
  return rest ? `${years} ${y} ${rest} міс` : `${years} ${y}`
}

export function childrenSummary(children: ChildInfo[]): string {
  if (!children?.length) return 'Дітей не вказано'
  return children
    .map((c) => {
      const icon = c.gender === 'girl' ? '👧' : c.gender === 'boy' ? '👦' : '🧒'
      return `${icon} ${c.name ? `${c.name}, ` : ''}${childAge(c.age_months)}`
    })
    .join(' · ')
}

/** «300 м», «1,2 км» */
export function distance(meters: number | null): string {
  if (meters == null) return ''
  if (meters < 950) return `${Math.round(meters / 10) * 10} м`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} км`
}

/** «зараз», «через 40 хв», «завтра 10:30», «сб, 14:00» */
export function whenLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.round((d.getTime() - now.getTime()) / 60000)

  if (diffMin <= 5 && diffMin >= -60) return 'зараз'
  if (diffMin > 5 && diffMin < 60) return `через ${diffMin} хв`

  const time = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `сьогодні ${time}`

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return `завтра ${time}`

  const day = d.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${day}, ${time}`
}

/** «5 хв тому», «вчора 18:20» — для чатів */
export function agoLabel(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'щойно'
  if (mins < 60) return `${mins} хв тому`

  const time = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return time

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `вчора ${time}`

  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) + ` ${time}`
}

/** «скільки лишилось жити мітці» */
export function expiresLabel(iso: string): string {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (mins <= 0) return 'завершилась'
  if (mins < 60) return `ще ${mins} хв`
  const hours = Math.round(mins / 60)
  return `ще ${hours} ${plural(hours, 'година', 'години', 'годин')}`
}

export function momAge(birthYear: number | null): string {
  if (!birthYear) return ''
  const age = new Date().getFullYear() - birthYear
  return `${age} ${plural(age, 'рік', 'роки', 'років')}`
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '🙂'
  )
}
