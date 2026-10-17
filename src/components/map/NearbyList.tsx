'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Empty, Stars } from '@/components/ui/controls'
import { FORMATS } from '@/lib/constants'
import { childrenSummary, distance, whenLabel } from '@/lib/format'
import type { NearbyPin } from '@/lib/types'

export function NearbyList({
  pins,
  onSelect,
}: {
  pins: NearbyPin[]
  onSelect: (pin: NearbyPin) => void
}) {
  if (!pins.length) {
    return (
      <Empty
        emoji="🫧"
        title="Поки нікого поруч"
        text="Спробуй збільшити радіус або постав свою мітку — мами поблизу побачать її одразу."
      />
    )
  }

  return (
    <div className="space-y-2.5 pb-2">
      {pins.map((pin) => {
        const f = FORMATS[pin.format]
        return (
          <button
            key={pin.id}
            onClick={() => onSelect(pin)}
            className="flex w-full gap-3 rounded-2xl border border-line bg-white p-3 text-left transition active:scale-[0.99] hover:bg-sand/50"
          >
            <Avatar
              src={pin.author_photo}
              name={pin.author_name}
              size="md"
              verified={pin.author_verified}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{pin.author_name}</span>
                {pin.author_reviews > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                    <Stars value={pin.author_rating} />
                    {pin.author_rating}
                  </span>
                )}
              </div>

              <div className="mt-0.5 truncate text-sm">{pin.title}</div>

              <div className="mt-1 truncate text-xs text-muted">
                {childrenSummary(pin.author_children)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span
                  className="rounded-full px-2 py-0.5 font-medium text-white"
                  style={{ background: f.color }}
                >
                  {f.emoji} {f.short}
                </span>
                <span className="rounded-full bg-sand px-2 py-0.5 text-muted">
                  {distance(pin.distance_m)}
                </span>
                <span className="rounded-full bg-sand px-2 py-0.5 text-muted">
                  {whenLabel(pin.starts_at)}
                </span>
                {pin.capacity > 1 && (
                  <span className="rounded-full bg-sand px-2 py-0.5 text-muted">
                    {pin.accepted_count}/{pin.capacity} мам
                  </span>
                )}
                {pin.is_mine && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700">
                    Моя мітка
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
