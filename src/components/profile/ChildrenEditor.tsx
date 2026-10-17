'use client'

import { childAge } from '@/lib/format'
import { Button, Input } from '@/components/ui/controls'

export type DraftChild = {
  id?: string
  name: string
  birthMonth: string // YYYY-MM
  gender: 'girl' | 'boy' | 'other' | null
}

const GENDERS: { value: DraftChild['gender']; label: string; emoji: string }[] = [
  { value: 'girl', label: 'Донька', emoji: '👧' },
  { value: 'boy', label: 'Син', emoji: '👦' },
  { value: 'other', label: 'Не вказувати', emoji: '🧒' },
]

function monthsSince(ym: string): number {
  if (!/^\d{4}-\d{2}$/.test(ym)) return 0
  const [y, m] = ym.split('-').map(Number)
  const now = new Date()
  return Math.max(0, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m))
}

export function ChildrenEditor({
  value,
  onChange,
}: {
  value: DraftChild[]
  onChange: (next: DraftChild[]) => void
}) {
  const thisMonth = new Date().toISOString().slice(0, 7)

  function update(i: number, patch: Partial<DraftChild>) {
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  return (
    <div className="space-y-3">
      {value.map((child, i) => (
        <div key={i} className="rounded-2xl border border-line bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-medium">
              Дитина {i + 1}
              {child.birthMonth && (
                <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-normal text-rose-700">
                  {childAge(monthsSince(child.birthMonth))}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-xs text-muted underline"
            >
              Прибрати
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input
              value={child.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Ім’я (необов’язково)"
            />
            <Input
              type="month"
              max={thisMonth}
              value={child.birthMonth}
              onChange={(e) => update(i, { birthMonth: e.target.value })}
            />
          </div>

          <div className="mt-3 flex gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => update(i, { gender: g.value })}
                className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition ${
                  child.gender === g.value
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-line bg-white text-muted'
                }`}
              >
                <span className="mr-1">{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        full
        onClick={() =>
          onChange([...value, { name: '', birthMonth: '', gender: null }])
        }
      >
        + Додати дитину
      </Button>
    </div>
  )
}
