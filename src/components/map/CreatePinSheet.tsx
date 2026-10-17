'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Sheet } from '@/components/ui/Sheet'
import { Button, Chip, Field, Input, Textarea } from '@/components/ui/controls'
import { DEFAULT_PIN_HOURS, FORMATS, FORMAT_LIST, MAX_SCHEDULE_DAYS } from '@/lib/constants'
import type { MeetFormat } from '@/lib/types'

/** Підказки в полі «на що запрошуєш» — щоб не дивитись у порожній рядок. */
const TITLE_HINTS: Record<MeetFormat, string> = {
  coffee: 'Кава поки діти сплять у візочках',
  walk: 'Гуляю в парку, приєднуйся',
  playground: 'Ми на майданчику біля школи',
  neighbors: 'Шукаю мам із нашого будинку',
  activity: 'Йога для мам у суботу',
  help: 'Треба посидіти з малим годину',
}

const CHILD_RANGES = [
  { label: 'Будь-який вік', min: null, max: null },
  { label: 'До року', min: 0, max: 11 },
  { label: 'Однорічки', min: 12, max: 23 },
  { label: '2 роки', min: 24, max: 35 },
  { label: '3 роки', min: 36, max: 47 },
  { label: '4–5 років', min: 48, max: 71 },
  { label: '6+ років', min: 72, max: null },
]

const DURATIONS = [2, 4, 6, 12, 24]

export function CreatePinSheet({
  at,
  onClose,
  onCreated,
  onPickOnMap,
}: {
  at: { lat: number; lng: number }
  onClose: () => void
  onCreated: () => void
  onPickOnMap: () => void
}) {
  const sb = supabaseBrowser()

  const [format, setFormat] = useState<MeetFormat>('coffee')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [startsAt, setStartsAt] = useState(defaultLocalDateTime())
  const [hours, setHours] = useState(DEFAULT_PIN_HOURS)
  const [capacity, setCapacity] = useState(1)
  const [childRange, setChildRange] = useState(CHILD_RANGES[0])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const { error: e } = await sb.rpc('create_pin', {
        in_format: format,
        in_title: title.trim() || TITLE_HINTS[format],
        in_description: description.trim(),
        in_lat: at.lat,
        in_lng: at.lng,
        in_place_name: placeName.trim() || null,
        in_starts_at: scheduled ? new Date(startsAt).toISOString() : new Date().toISOString(),
        in_hours: hours,
        in_capacity: capacity,
        in_child_age_min: childRange.min,
        in_child_age_max: childRange.max,
      })
      if (e) throw e
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const maxDate = new Date(Date.now() + MAX_SCHEDULE_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 16)

  return (
    <Sheet open onClose={onClose} title="Нова мітка">
      <div className="space-y-5 pb-2">
        {/* Формат */}
        <div>
          <h3 className="mb-2.5 text-sm font-medium">Формат зустрічі</h3>
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_LIST.map((key) => {
              const f = FORMATS[key]
              const active = format === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormat(key)}
                  className={`rounded-2xl border p-3 text-center transition active:scale-[0.97] ${
                    active ? 'border-transparent text-white' : 'border-line bg-white'
                  }`}
                  style={active ? { background: f.color } : undefined}
                >
                  <div className="text-xl">{f.emoji}</div>
                  <div className="mt-1 text-xs font-medium">{f.short}</div>
                </button>
              )
            })}
          </div>
        </div>

        <Field label="На що запрошуєш?">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            placeholder={TITLE_HINTS[format]}
            autoFocus
          />
        </Field>

        <Field label="Деталі" hint="Необов’язково. Напр. «з візочком», «маю годину до сну малої»">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 400))}
            placeholder="Буду з візочком, маю годину"
          />
        </Field>

        {/* Місце */}
        <div className="rounded-2xl border border-line bg-sand/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Місце</div>
              <div className="truncate text-xs text-muted">
                {at.lat.toFixed(4)}, {at.lng.toFixed(4)} — там, де відкрита мапа
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onPickOnMap}>
              Вибрати на мапі
            </Button>
          </div>
          <Input
            className="mt-3"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value.slice(0, 120))}
            placeholder="Назва місця: «Кав’ярня Aroma» (необов’язково)"
          />
        </div>

        {/* Коли */}
        <div>
          <h3 className="mb-2.5 text-sm font-medium">Коли</h3>
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-sand p-1 text-sm">
            <button
              onClick={() => setScheduled(false)}
              className={`rounded-lg py-2 font-medium transition ${!scheduled ? 'bg-white shadow-sm' : 'text-muted'}`}
            >
              Зараз
            </button>
            <button
              onClick={() => setScheduled(true)}
              className={`rounded-lg py-2 font-medium transition ${scheduled ? 'bg-white shadow-sm' : 'text-muted'}`}
            >
              Запланувати
            </button>
          </div>

          {scheduled && (
            <Input
              type="datetime-local"
              value={startsAt}
              min={defaultLocalDateTime()}
              max={maxDate}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          )}

          <div className="mt-3">
            <div className="mb-2 text-xs text-muted">Мітка живе</div>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((h) => (
                <Chip key={h} active={hours === h} onClick={() => setHours(h)}>
                  {h} год
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Скільки мам */}
        <div>
          <h3 className="mb-2.5 text-sm font-medium">Скільки мам кличеш</h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} active={capacity === n} onClick={() => setCapacity(n)}>
                {n === 1 ? 'Одну' : `До ${n}`}
              </Chip>
            ))}
          </div>
          {capacity > 1 && (
            <p className="mt-2 text-xs text-muted">
              Мітка сховається з мапи, коли місця закінчаться. Для компанії вмикається спільний чат.
            </p>
          )}
        </div>

        {/* Кого шукаєш */}
        <div>
          <h3 className="mb-1 text-sm font-medium">Вік дитини в компанії</h3>
          <p className="mb-2.5 text-xs text-muted">
            Хто не підходить — побачить мітку й причину, але приєднатись не зможе.
          </p>
          <div className="flex flex-wrap gap-2">
            {CHILD_RANGES.map((r) => (
              <Chip
                key={r.label}
                active={childRange.label === r.label}
                onClick={() => setChildRange(r)}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        </div>

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <Button size="lg" full loading={busy} onClick={create}>
          Поставити мітку
        </Button>
      </div>
    </Sheet>
  )
}

/** Значення для <input type="datetime-local"> у місцевому часі. */
function defaultLocalDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(0, 0, 0)
  const offset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}
