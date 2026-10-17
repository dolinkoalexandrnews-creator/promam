'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { FALLBACK_CENTER, FORMATS, FORMAT_LIST, RADIUS_OPTIONS } from '@/lib/constants'
import { Chip, Spinner } from '@/components/ui/controls'
import { Sheet } from '@/components/ui/Sheet'
import { PinSheet } from '@/components/map/PinSheet'
import { CreatePinSheet } from '@/components/map/CreatePinSheet'
import { NearbyList } from '@/components/map/NearbyList'
import { FiltersSheet, type Filters, EMPTY_FILTERS } from '@/components/map/FiltersSheet'
import type { Child, MeetFormat, NearbyPin, Profile } from '@/lib/types'

const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-sand">
      <Spinner className="h-6 w-6 text-rose-500" />
    </div>
  ),
})

export function MapScreen({ profile }: { profile: Profile & { children: Child[] } }) {
  const sb = supabaseBrowser()

  const [me, setMe] = useState<[number, number] | null>(null)
  const [center, setCenter] = useState<[number, number]>(FALLBACK_CENTER)
  const [geoDenied, setGeoDenied] = useState(false)

  const [pins, setPins] = useState<NearbyPin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formats, setFormats] = useState<MeetFormat[]>([])
  const [radius, setRadius] = useState(5000)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const [selected, setSelected] = useState<NearbyPin | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showList, setShowList] = useState(false)
  const [creating, setCreating] = useState<{ lat: number; lng: number } | null>(null)
  const [pickingSpot, setPickingSpot] = useState(false)

  const firstLoad = useRef(true)

  // --- Геолокація ------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoDenied(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setMe(point)
        setCenter(point)
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }, [])

  // --- Завантаження міток ---------------------------------------------
  const load = useCallback(async () => {
    setError(null)
    if (firstLoad.current) setLoading(true)

    const { data, error: rpcError } = await sb.rpc('nearby_pins', {
      in_lat: center[0],
      in_lng: center[1],
      radius_m: radius,
      in_formats: formats.length ? formats : null,
      mom_age_min: filters.momAgeMin,
      mom_age_max: filters.momAgeMax,
      child_age_min: filters.childAgeMin,
      child_age_max: filters.childAgeMax,
    })

    if (rpcError) setError(rpcError.message)
    else setPins((data ?? []) as NearbyPin[])

    setLoading(false)
    firstLoad.current = false
  }, [sb, center, radius, formats, filters])

  useEffect(() => {
    void load()
  }, [load])

  // Мітки оновлюються наживо, щойно хтось створює чи приєднується.
  useEffect(() => {
    const channel = sb
      .channel('map-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, () => void load())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pin_participants' },
        () => void load(),
      )
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }, [sb, load])

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== null).length,
    [filters],
  )

  const sorted = useMemo(() => [...pins].sort((a, b) => a.distance_m - b.distance_m), [pins])

  function startCreating() {
    setSelected(null)
    setShowList(false)
    setCreating({ lat: center[0], lng: center[1] })
  }

  return (
    <div className="relative h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full overflow-hidden">
      <MapCanvas
        center={center}
        me={me}
        pins={pins}
        picking={pickingSpot}
        onPinClick={(pin) => {
          if (pickingSpot) return
          setSelected(pin)
        }}
        onMapClick={(lat, lng) => {
          if (pickingSpot) {
            setCreating({ lat, lng })
            setPickingSpot(false)
          }
        }}
      />

      {/* --- Верхня панель --- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3">
        <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-2xl bg-white/92 p-2 shadow-lg shadow-ink/5 backdrop-blur-xl">
          <div className="pl-1.5 text-base font-bold tracking-tight">
            PRO<span className="text-rose-500">MAM</span>
          </div>

          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            {FORMAT_LIST.map((key) => {
              const f = FORMATS[key]
              const active = formats.includes(key)
              return (
                <button
                  key={key}
                  onClick={() =>
                    setFormats(active ? formats.filter((x) => x !== key) : [...formats, key])
                  }
                  title={f.label}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base transition active:scale-95 ${
                    active ? 'text-white shadow-sm' : 'bg-sand'
                  }`}
                  style={active ? { background: f.color } : undefined}
                >
                  {f.emoji}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setShowFilters(true)}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand transition active:scale-95"
            aria-label="Фільтри"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Радіус */}
        <div className="no-scrollbar pointer-events-auto mx-auto mt-2 flex max-w-lg gap-1.5 overflow-x-auto px-0.5">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRadius(r.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition active:scale-95 ${
                radius === r.value ? 'bg-ink text-cream' : 'bg-white/92 text-muted backdrop-blur'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- Повідомлення про геолокацію --- */}
      {geoDenied && (
        <div className="pointer-events-auto absolute inset-x-3 top-32 z-[500] mx-auto max-w-lg rounded-2xl bg-white/95 p-4 text-sm shadow-lg backdrop-blur">
          <b>Геолокація вимкнена.</b> Показуємо центр Києва. Дозволь доступ до місця в налаштуваннях
          браузера — або просто посунь мапу туди, де ти є.
        </div>
      )}

      {pickingSpot && (
        <div className="pointer-events-none absolute inset-x-3 top-32 z-[500] mx-auto max-w-lg rounded-2xl bg-ink/90 px-4 py-3 text-center text-sm font-medium text-cream shadow-lg">
          Тапни на мапі місце зустрічі
        </div>
      )}

      {error && (
        <div className="absolute inset-x-3 top-32 z-[500] mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
          {error}
        </div>
      )}

      {/* --- Кнопки праворуч --- */}
      <div className="absolute right-3 bottom-28 z-[500] flex flex-col gap-2">
        <button
          onClick={() => me && setCenter(me)}
          disabled={!me}
          aria-label="Моє місце"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-lg transition active:scale-95 disabled:opacity-40"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={() => setPickingSpot((v) => !v)}
          aria-label="Вибрати місце на мапі"
          className={`grid h-11 w-11 place-items-center rounded-full shadow-lg transition active:scale-95 ${
            pickingSpot ? 'bg-ink text-cream' : 'bg-white text-ink'
          }`}
        >
          📍
        </button>
      </div>

      {/* --- Нижня картка «Хто поруч» --- */}
      <button
        onClick={() => setShowList(true)}
        className="absolute inset-x-3 bottom-3 z-[500] mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-white/95 p-3 text-left shadow-xl shadow-ink/10 backdrop-blur-xl transition active:scale-[0.99]"
      >
        <div className="flex -space-x-2.5">
          {sorted.slice(0, 3).map((p) => (
            <span
              key={p.id}
              className="grid h-9 w-9 place-items-center rounded-full text-base ring-2 ring-white"
              style={{ background: FORMATS[p.format].color }}
            >
              {FORMATS[p.format].emoji}
            </span>
          ))}
          {sorted.length === 0 && (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sand text-base">
              🔍
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            {loading ? 'Шукаю мам поруч…' : `Хто поруч · ${sorted.length}`}
          </div>
          <div className="truncate text-xs text-muted">
            {sorted[0]
              ? `Найближча: ${sorted[0].author_name} — ${sorted[0].title}`
              : 'Поки тихо. Постав мітку першою — її побачать.'}
          </div>
        </div>
        <span className="text-muted">›</span>
      </button>

      {/* --- Кнопка «Поставити мітку» --- */}
      <button
        onClick={startCreating}
        className="absolute right-3 bottom-[5.5rem] z-[501] grid h-14 w-14 place-items-center rounded-full bg-rose-500 text-2xl text-white shadow-xl shadow-rose-500/30 transition active:scale-95"
        aria-label="Поставити мітку"
      >
        +
      </button>

      {/* --- Шторки --- */}
      <Sheet open={showList} onClose={() => setShowList(false)} title={`Хто поруч · ${sorted.length}`}>
        <NearbyList
          pins={sorted}
          onSelect={(p) => {
            setShowList(false)
            setSelected(p)
            setCenter([p.lat, p.lng])
          }}
        />
      </Sheet>

      <FiltersSheet
        open={showFilters}
        value={filters}
        onClose={() => setShowFilters(false)}
        onChange={setFilters}
      />

      {selected && (
        <PinSheet
          pin={selected}
          me={profile}
          onClose={() => setSelected(null)}
          onChanged={() => void load()}
        />
      )}

      {creating && (
        <CreatePinSheet
          at={creating}
          onClose={() => setCreating(null)}
          onPickOnMap={() => {
            setCreating(null)
            setPickingSpot(true)
          }}
          onCreated={() => {
            setCreating(null)
            void load()
          }}
        />
      )}
    </div>
  )
}
