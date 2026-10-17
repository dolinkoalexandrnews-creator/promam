'use client'

import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button, Chip } from '@/components/ui/controls'

export type Filters = {
  momAgeMin: number | null
  momAgeMax: number | null
  childAgeMin: number | null
  childAgeMax: number | null
}

export const EMPTY_FILTERS: Filters = {
  momAgeMin: null,
  momAgeMax: null,
  childAgeMin: null,
  childAgeMax: null,
}

/** Готові діапазони віку дитини — люди думають «однорічка», не «12–23 міс». */
const CHILD_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Будь-який', min: null, max: null },
  { label: 'До року', min: 0, max: 11 },
  { label: 'Однорічка', min: 12, max: 23 },
  { label: '2 роки', min: 24, max: 35 },
  { label: '3 роки', min: 36, max: 47 },
  { label: '4 роки', min: 48, max: 59 },
  { label: '5 років', min: 60, max: 71 },
  { label: '6 років', min: 72, max: 83 },
  { label: 'Школа 7+', min: 84, max: null },
]

const MOM_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Будь-який', min: null, max: null },
  { label: 'До 25', min: null, max: 25 },
  { label: '25–30', min: 25, max: 30 },
  { label: '30–35', min: 30, max: 35 },
  { label: '35–40', min: 35, max: 40 },
  { label: '40+', min: 40, max: null },
]

export function FiltersSheet({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean
  value: Filters
  onClose: () => void
  onChange: (next: Filters) => void
}) {
  const [draft, setDraft] = useState<Filters>(value)

  function apply() {
    onChange(draft)
    onClose()
  }

  function reset() {
    setDraft(EMPTY_FILTERS)
    onChange(EMPTY_FILTERS)
    onClose()
  }

  const sameChild = (r: (typeof CHILD_RANGES)[number]) =>
    draft.childAgeMin === r.min && draft.childAgeMax === r.max
  const sameMom = (r: (typeof MOM_RANGES)[number]) =>
    draft.momAgeMin === r.min && draft.momAgeMax === r.max

  return (
    <Sheet open={open} onClose={onClose} title="Фільтри">
      <div className="space-y-6 pb-2">
        <div>
          <h3 className="mb-1 text-sm font-medium">Вік дитини</h3>
          <p className="mb-3 text-xs text-muted">
            Найважливіший фільтр: у мам з дітьми одного віку збігаються режим і теми.
          </p>
          <div className="flex flex-wrap gap-2">
            {CHILD_RANGES.map((r) => (
              <Chip
                key={r.label}
                active={sameChild(r)}
                onClick={() => setDraft({ ...draft, childAgeMin: r.min, childAgeMax: r.max })}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">Вік мами</h3>
          <div className="flex flex-wrap gap-2">
            {MOM_RANGES.map((r) => (
              <Chip
                key={r.label}
                active={sameMom(r)}
                onClick={() => setDraft({ ...draft, momAgeMin: r.min, momAgeMax: r.max })}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" size="lg" onClick={reset}>
            Скинути
          </Button>
          <Button size="lg" full onClick={apply}>
            Показати
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
